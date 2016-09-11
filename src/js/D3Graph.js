/*
 * D3Graph.js
 */
"use-strict";

// 各種デフォルト設定値
const SVG_ELEMENT_HEIGHT = 300;
const SVG_ELEMENT_WIDTH = 700;
const TITLE_SPACE_HEIGHT = 20;
const PADDING_LEFT = 40;
const PADDING_RIGHT = 10;
const PADDING_TOP = 10;
const PADDING_BOTTOM = 40;
const GRAPH_HEIGHT = SVG_ELEMENT_HEIGHT - (PADDING_TOP+PADDING_BOTTOM) - TITLE_SPACE_HEIGHT;
const GRAPH_WIDTH = SVG_ELEMENT_WIDTH - (PADDING_LEFT+PADDING_RIGHT);

function D3Graph(key, D3Object) {
  this.svgElementHeight = SVG_ELEMENT_HEIGHT;
  this.svgElementWidth = SVG_ELEMENT_WIDTH;
  this.titleSpaceHeight = TITLE_SPACE_HEIGHT;
  this.paddingLeft = PADDING_LEFT;
  this.paddingRight = PADDING_RIGHT;
  this.paddingTop = PADDING_TOP;
  this.paddingBottom = PADDING_BOTTOM;
  this.graphHeight = GRAPH_HEIGHT;
  this.graphWidth = GRAPH_WIDTH;

  this.key = key;
  this.xValues = [];
  this.yValues = [];
  this.labelRenaderIntarval = 5;

  this.d3 = D3Object;
};

D3Graph.prototype.appendData = function (xData, yData) {
  this.xValues.push(xData);
  this.yValues.push(yData);
};

D3Graph.prototype.clearData = function () {
  this.xValues = [];
  this.yValues = [];
};

D3Graph.prototype.resetStyle = function () {
  this.svgElementHeight = SVG_ELEMENT_HEIGHT;
  this.svgElementWidth = SVG_ELEMENT_WIDTH;
  this.titleSpaceHeight = TITLE_SPACE_HEIGHT;
  this.paddingLeft = PADDING_LEFT;
  this.paddingRight = PADDING_RIGHT;
  this.paddingTop = PADDING_TOP;
  this.paddingBottom = PADDING_BOTTOM;
  this.graphHeight = GRAPH_HEIGHT;
  this.graphWidth = GRAPH_WIDTH;
};

D3Graph.prototype.remove = function () {
  this.d3.select("#d3graph>svg#"+this.key).remove();
};

D3Graph.prototype.render = function (xScope, yScope) {
  // SVG 要素追加
  if (this.d3.select("#d3graph>svg#" + this.key).empty()) {
    this.d3.select("#d3graph")
      .append("svg")
      .attr('class', 'chart')
      .attr('id', this.key)
      .attr("width", this.svgElementWidth)
      .attr("height", this.svgElementHeight);
  }

  // キーに対応するSVG要素の取得
  var stage = this.d3.select("svg#"+this.key);

  // X軸Y軸の描画最大値，最小値を計算する
  // X軸は時間だが，指定範囲内のデータの切り出しは後に別にやる
  // ここではいくつデータを取り出すかだけ指定すれば良いため，最小値0〜最大値maxX-minXをとっている
  var xSize = xScope != null ? xScope[1] - xScope[0] + 1 : this.xValues.length;
  var maxGraphXData = xSize;
  var minGraphXData = 0;
  // 動的にY軸の描画範囲を変更する場合は，上限と下限を大きめ/小さめに設定する
  // こうしないと，minYData == maxYData ( minYData - maxYData == 0 ) となり，後の計算式で0除算を引き起こす
  var yMargin = 10;
  var maxGraphYData = yScope != null ? yScope[1] : Math.max.apply(null, this.xValues) + yMargin;
  var minGraphYData = yScope != null ? yScope[0] : Math.min.apply(null, this.xValues) - yMargin;

  // スケールと線分描画のための関数を定義
  var xScale = this.d3.scale.linear()
        .range([this.paddingLeft, this.svgElementWidth -this. paddingRight])
        .domain([minGraphXData, maxGraphXData]);
  var yScale = this.d3.scale.linear()
        .range([this.svgElementHeight - this.paddingBottom, this.paddingTop + this.titleSpaceHeight])
        .domain([minGraphYData, maxGraphYData]);
  var line = this.d3.svg.line()
        .x(function(d,i){return xScale(i);})
        .y(function(d,i){return yScale(d);})
        .interpolate("linear");

  // TODO: slice は効率が悪いかも？
  var len = this.xValues.length;
  var shownValues = this.xValues.slice(
    len < xSize ? 0 : len - xSize,
    len
  );

  // グラフの再描画
  stage.selectAll("path#"+this.key).remove();
  stage.append("path")
    .attr("id", this.key)
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
      return this.paddingLeft + ( this.graphWidth / xSize ) * i;
    }.bind(this))
    .attr("y", function(d) {
      return this.paddingTop + this.titleSpaceHeight + this.graphHeight
        - ( this.graphHeight / ( maxGraphYData - minGraphYData ) )
        * ( d - minGraphYData );
    }.bind(this))
    .attr('opacity', function(d, i) {
      if (i == 0) {
        return 1;
      }
      // 直前の値との差分から，ラベルを表示するかしないか決める
      if (shownValues[i] - shownValues[i-1] < this.labelRenaderIntarval) {
        return 0;
      } else {
        return 1;
      }
    }.bind(this))
    .attr("font-family", "sans-serif")
    .attr("font-size", "11px")
    .attr("fill", "black");
  stage.append("text")
    .attr("x", this.paddingLeft)
    .attr("y", this.titleSpaceHeight)
    .text(this.key)
    .attr("font-family", "sans-serif")
    .attr("font-size", "16px")
    .attr("fill", "black");

  // 軸の再描画
  // 対応する範囲の clock の値を抜き出す
  var historyLength = this.yValues.length;
  var maxIndex = historyLength - 1;
  var minIndex = historyLength < xSize ? 0 : maxIndex - xSize - 1;
  var maxAxisXData = this.yValues[maxIndex];
  var minAxisXData = this.yValues[minIndex];

  // 軸の描画がずれるため，画面幅いっぱいまで軸が伸びていない場合の処理を追加しておく
  var xMaxAxisRange =
        historyLength < xSize ?
        this.svgElementWidth - this.paddingRight - ((xSize-historyLength) * (this.graphWidth/(xSize+1))) :
        this.svgElementWidth - this.paddingRight;
  var xAxisScale = this.d3.scale.linear()
        .range([this.paddingLeft, xMaxAxisRange])
        .domain([minAxisXData/1000, maxAxisXData/1000]);
  var yAxisScale = yScale;
  var xAxis = this.d3.svg.axis()
        .scale(xAxisScale)
        .orient('bottom');
  var yAxis = this.d3.svg.axis()
        .scale(yAxisScale)
        .orient('left');

  // 軸を描画
  stage.selectAll("g").remove();
  stage.append('g')
    .attr("class", "axis")
    .attr("transform", "translate(0," + ( this.svgElementHeight - this.paddingBottom ) + ")")
    .call(xAxis);
  stage.append('g')
    .attr("class", "axis")
    .attr("transform", "translate(" + this.paddingLeft + ",0)")
    .call(yAxis);
};

module.exports = D3Graph;
