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

  this.xScale = this.d3.scale.linear()
    .range([this.paddingLeft, this.svgElementWidth -this. paddingRight]);
  this.yScale = this.d3.scale.linear()
    .range([this.svgElementHeight - this.paddingBottom, this.paddingTop + this.titleSpaceHeight]);

  this.line = this.d3.svg.line();

  this.xAxis = this.d3.svg.axis()
    .orient('bottom');
  this.yAxis = this.d3.svg.axis()
    .orient('left');

  // brush オブジェクト生成
  // グラフの一部を選択するのに必要
  this.brush = this.d3.svg.brush() //brushオブジェクト作成
    .on("brushend", this.brushed.bind(this));
};

/*
 * 描画データを追加する
 */
D3Graph.prototype.appendData = function (xData, yData) {
  this.xValues.push(xData);
  this.yValues.push(yData);
};

/*
 * 保持している描画データをリセットする
 */
D3Graph.prototype.clearData = function () {
  this.xValues = [];
  this.yValues = [];
};

/*
 * グラフのスタイル(各箇所の大きさ)をデフォルト設定にリセットする
 */
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

/*
 * グラフを削除する
 */
D3Graph.prototype.remove = function () {
  this.d3.select("#d3graph>svg#"+this.key).remove();
};

/*
 * グラフのスケールを設定する
 */
D3Graph.prototype.updateScale = function (xScope, yScope) {
  // 描画範囲の設定
  var minGraphXData = xScope != null ? xScope[0] : (this.xValues[0]);
  var maxGraphXData = xScope != null ? xScope[1] : (this.xValues[this.xValues.length-1]);
  var yMargin = 10;
  var minGraphYData = yScope != null ? yScope[0] : Math.min.apply(null, this.yValues) - yMargin;
  var maxGraphYData = yScope != null ? yScope[1] : Math.max.apply(null, this.yValues) + yMargin;

  // スケールと線分描画のための関数を定義
  this.xScale.domain([minGraphXData, maxGraphXData]);
  this.yScale.domain([minGraphYData, maxGraphYData]);
  this.line
    .x(function(d,i){return this.xScale(this.xValues[i]);}.bind(this))
    .y(function(d,i){return this.yScale(d);}.bind(this))
    .interpolate("linear");

  // brushオブジェクトにスケールを設定
  this.brush
    .x(this.xScale)
    .y(this.yScale);

  // 軸にスケールを設定
  this.xAxis.scale(this.xScale);
  this.yAxis.scale(this.yScale);
};

/*
 * 現在のスケール設定に従ってグラフを描画する
 */
D3Graph.prototype.render = function () {
  // SVG 要素追加
  if (this.d3.select("#d3graph>svg#" + this.key).empty()) {
    this.d3.select("#d3graph")
      .append("svg")
      .attr('class', 'chart')
      .attr('id', this.key)
      .attr("width", this.svgElementWidth)
      .attr("height", this.svgElementHeight);
  }
  var svg = this.d3.select("svg#"+this.key);

  // グラフの再描画
  svg.selectAll("path#"+this.key).remove();
  svg.append("path")
    .attr("id", this.key)
    .attr("d", this.line(this.yValues))
    .attr("stroke", "steelblue")
    .attr("fill", "none");

  // グラフタイトルの再描画
  svg.selectAll("text").remove();
  svg.append("text")
    .attr("x", this.paddingLeft)
    .attr("y", this.titleSpaceHeight)
    .text(this.key)
    .attr("font-family", "sans-serif")
    .attr("font-size", "16px")
    .attr("fill", "black");

  // 軸の描画
  svg.selectAll("g").remove();
  svg.append('g')
    .attr("class", "axis")
    .attr("transform", "translate(0," + ( this.svgElementHeight - this.paddingBottom ) + ")")
    .call(this.xAxis);
  svg.append('g')
    .attr("class", "axis")
    .attr("transform", "translate(" + this.paddingLeft + ",0)")
    .call(this.yAxis);
};

/*
 * brushオブジェクトを追加する
 * brushは透明なrectをグループ上設置しマウスイベントを取得する。
 * 設置したrect上ではドラッグで範囲選択が可能
 * 範囲が選択されている状態でbrush.extent()メソッドを実行するとその範囲のデータ値を返す
 */
D3Graph.prototype.addBlush = function () {
  var stage = this.d3.select("svg#"+this.key);

  stage.append("g")
    .attr("class", "brush")
    .call(this.brush)
    .selectAll("rect")
    .attr("y", -6)
    .attr("height", this.graphHeight + 7)
    .style({
      "fill": "#69f",
      "fill-opacity": "0.3"
    });
};

/*
 * brushオブジェクト用のコールバック関数
 * グラフ上で矩形選択した直後に呼び出される
 */
D3Graph.prototype.brushed = function () {
  var xStart = this.brush.extent()[0][0];
  var xEnd = this.brush.extent()[1][0];
  var yStart = this.brush.extent()[0][1];
  var yEnd = this.brush.extent()[1][1];

  if (xStart == xEnd && yStart == yEnd) {
    // デフォルトに戻す
    this.updateScale();
  } else {
    this.updateScale([xStart, xEnd], [yStart, yEnd]);
  }

  this.render();
  this.addBlush();

  // brushオブジェクト上の矩形を消す
  this.d3.select('svg#'+this.key).select('.extent')
    .attr({width: 0, height: 0, x: 0, y: 0});
};

module.exports = D3Graph;
