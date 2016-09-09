/*
 * D3GraphRenderer.js
 * グラフ描画のためのモジュール
 */
"use-strict";

// 各種デフォルト設定値
const SVG_ELEMENT_HEIGHT = 500;
const SVG_ELEMENT_WIDTH = 1000;
const TITLE_SPACE_HEIGHT = 20;
const PADDING_LEFT = 40;
const PADDING_RIGHT = 10;
const PADDING_TOP = 10;
const PADDING_BOTTOM = 40;
const GRAPH_HEIGHT = SVG_ELEMENT_HEIGHT - (PADDING_TOP+PADDING_BOTTOM) - TITLE_SPACE_HEIGHT;
const GRAPH_WIDTH = SVG_ELEMENT_WIDTH - (PADDING_LEFT+PADDING_RIGHT);

function D3GraphRenderer (D3Object, keys) {
  this.d3 = D3Object;
  this.receiveValues = {
    "clock": {},
    "gyro": {},
    "touch": {},
    "sonar": {},
    "brightness": {},
    "rgb_r": {},
    "rgb_g": {},
    "rgb_b": {},
    "hsv_h": {},
    "hsv_s": {},
    "hsv_v": {},
    "arm_count": {},
    "left_count": {},
    "right_count": {},
    "length": {},
    "angle": {},
    "coordinate_x": {},
    "coordinate_y": {}
  };

  Object.keys(this.receiveValues).forEach(function(key) {
    // 受信した値の履歴を初期化
    this.receiveValues[key].history = [];
  }.bind(this));

  // SVG要素の追加
  for (var i=0; i<keys.length; i++) {
    this.d3.select("#d3graph")
      .append("svg")
      .attr('class', 'chart')
      .attr('id', keys[i])
      .attr("width", SVG_ELEMENT_WIDTH)
      .attr("height", SVG_ELEMENT_HEIGHT);
  }
};

D3GraphRenderer.prototype.getReceiveValues = function () {
  return this.receiveValues;
};

D3GraphRenderer.prototype.update = function (key, value) {
  // TODO: データが入り過ぎるとやばそうなのでどうにかする
  this.receiveValues[key].history.push(value);
};

// リアルタイムにグラフを表示する
// @param key 描画したい要素のキー
// @param 最新の値からどの範囲までを描画するか(現在動作しない)
// @param グラフのY軸の描画範囲として，値の取りうる最大値，最小値を設定
D3GraphRenderer.prototype.renderDynamicGraph = function (key, size, yScope) {
  var xSize = size == null ? 100 : size;
  var stage = this.d3.select("svg#"+key);
  // グラフ描画用の設定
  var maxGraphXData = xSize;
  var minGraphXData = 0;
  // 動的にY軸の描画範囲を変更する場合は，上限と下限を大きめ/小さめに設定する
  // こうしないと，minYData == maxYData ( minYData - maxYData == 0 ) となり，後の計算式で0除算を引き起こす
  var yMargin = 10;
  var maxGraphYData = yScope != null ? yScope[1] : Math.max.apply(null, this.receiveValues[key].history) + yMargin;
  var minGraphYData = yScope != null ? yScope[0] : Math.min.apply(null, this.receiveValues[key].history) - yMargin;
  var xScale = this.d3.scale.linear()
        .range([PADDING_LEFT, SVG_ELEMENT_WIDTH - PADDING_RIGHT])
        .domain([minGraphXData, maxGraphXData]);
  var yScale = this.d3.scale.linear()
        .range([SVG_ELEMENT_HEIGHT - PADDING_BOTTOM, PADDING_TOP + TITLE_SPACE_HEIGHT])
        .domain([minGraphYData, maxGraphYData]);
  var line = this.d3.svg.line()
        .x(function(d,i){return xScale(i);})
        .y(function(d,i){return yScale(d);})
        .interpolate("linear");

  // TODO: slice は効率が悪いかも？
  var len = this.receiveValues[key].history.length;
  var shownValues = this.receiveValues[key].history.slice(
    len < xSize ? 0 : len - xSize,
    len
  );

  // グラフの再描画
  stage.selectAll("path#"+key).remove();
  stage.append("path")
    .attr("id", key)
    .attr("d", line(shownValues))
    .attr("stroke", "steelblue")
    .attr("fill", "none");

  // ラベルとグラフタイトルの再描画
  stage.selectAll("text").remove();
  stage.selectAll("text")
    .data(shownValues)
    .enter()
    .append("text")
    .text(function(d) { return d; })
    .attr("x", function(d, i) {
      return PADDING_LEFT + ( GRAPH_WIDTH / xSize ) * i;
    })
    .attr("y", function(d) {
      return PADDING_TOP + TITLE_SPACE_HEIGHT + GRAPH_HEIGHT
        - ( GRAPH_HEIGHT / ( maxGraphYData - minGraphYData ) )
        * ( d - minGraphYData );
    })
    .attr("font-family", "sans-serif")
    .attr("font-size", "11px")
    .attr("fill", "black");
  stage.append("text")
    .attr("x", PADDING_LEFT)
    .attr("y", TITLE_SPACE_HEIGHT)
    .text(key)
    .attr("font-family", "sans-serif")
    .attr("font-size", "16px")
    .attr("fill", "black");

  // 軸の再描画
  // 対応する範囲の clock の値を抜き出す
  var historyLength = this.receiveValues["clock"].history.length;
  var maxIndex = historyLength - 1;
  var minIndex = historyLength < xSize ? 0 : maxIndex - xSize - 1;
  var maxAxisXData = this.receiveValues["clock"].history[maxIndex];
  var minAxisXData = this.receiveValues["clock"].history[minIndex];
  // 軸の描画がずれるため，画面幅いっぱいまで軸が伸びていない場合の処理を追加しておく
  var xMaxAxisRange =
        historyLength < xSize ?
        SVG_ELEMENT_WIDTH - PADDING_RIGHT - ((xSize-historyLength) * (GRAPH_WIDTH/(xSize+1))) :
        SVG_ELEMENT_WIDTH - PADDING_RIGHT;
  var xAxisScale = this.d3.scale.linear()
        .range([PADDING_LEFT, xMaxAxisRange])
        .domain([minAxisXData/1000, maxAxisXData/1000]);
  var yAxisScale = yScale;
  var xAxis = this.d3.svg.axis()
        .scale(xAxisScale)
        .orient('bottom');
  var yAxis = this.d3.svg.axis()
        .scale(yAxisScale)
        .orient('left');
  // TODO: X軸を時刻にしたい
  stage.selectAll("g").remove();
  stage.append('g')
    .attr("class", "axis")
    .attr("transform", "translate(0," + ( SVG_ELEMENT_HEIGHT - PADDING_BOTTOM ) + ")")
    .call(xAxis);
  stage.append('g')
    .attr("class", "axis")
    .attr("transform", "translate(" + PADDING_LEFT + ",0)")
    .call(yAxis);
};

module.exports = D3GraphRenderer;
