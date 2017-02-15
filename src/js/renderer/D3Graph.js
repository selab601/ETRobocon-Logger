/*
 * D3Graph.js
 * グラフ描画のためのモジュール
 */
"use-strict";

// 各種デフォルト設定値
const SVG_ELEMENT_HEIGHT = 270;
const SVG_ELEMENT_WIDTH = 700;
const TITLE_SPACE_HEIGHT = 20;
const PADDING_LEFT = 40;
const PADDING_RIGHT = 10;
const PADDING_TOP = -15;
const PADDING_BOTTOM = 40;
const GRAPH_HEIGHT = SVG_ELEMENT_HEIGHT - (PADDING_TOP+PADDING_BOTTOM) - TITLE_SPACE_HEIGHT;
const GRAPH_WIDTH = SVG_ELEMENT_WIDTH - (PADDING_LEFT+PADDING_RIGHT);

function D3Graph( key, renderer, range ) {
  this.svgElementHeight = SVG_ELEMENT_HEIGHT;
  this.svgElementWidth  = SVG_ELEMENT_WIDTH;
  this.titleSpaceHeight = TITLE_SPACE_HEIGHT;
  this.paddingLeft      = PADDING_LEFT;
  this.paddingRight     = PADDING_RIGHT;
  this.paddingTop       = PADDING_TOP;
  this.paddingBottom    = PADDING_BOTTOM;
  this.graphHeight      = GRAPH_HEIGHT;
  this.graphWidth       = GRAPH_WIDTH;

  this.key       = key;
  this.renderer  = renderer;
  this.range     = range;
  this.xValues   = [];
  this.yValues   = [];
  this.labelRenaderIntarval = 5;

  this.d3 = require('../lib/d3.min.js');

  this.xScale = this.d3.scale.linear()
    .range([this.paddingLeft, this.svgElementWidth - this. paddingRight]);
  this.yScale = this.d3.scale.linear()
    .range([this.svgElementHeight - this.paddingBottom, this.paddingTop + this.titleSpaceHeight]);

  this.line         = this.d3.svg.line();
  this.markLine     = this.d3.svg.line();
  this.bisectXValue = this.d3.bisector(function(d) { return d; }).left,

  this.xAxis = this.d3.svg.axis()
    .orient('bottom')
    .innerTickSize(-this.graphHeight)  // 目盛線の長さ（内側）
    .outerTickSize(5) // 目盛線の長さ（外側）
    .tickPadding(10); // 目盛線とテキストの間の長さ
  this.yAxis = this.d3.svg.axis()
    .orient('left')
    .innerTickSize(-this.graphWidth)  // 目盛線の長さ（内側）
    .outerTickSize(5) // 目盛線の長さ（外側）
    .tickPadding(10); // 目盛線とテキストの間の長さ

  this.brush = this.d3.svg.brush();
  this.mark = null;
};

/**
 * 描画データを追加する
 */
D3Graph.prototype.appendData = function (xData, yData) {
  if ( this.xValues.length > this.range ) {
    this.xValues.shift();
    this.yValues.shift();
  }
  this.xValues.push(xData);
  this.yValues.push(yData);
};

/**
 * 保持している描画データをリセットする
 */
D3Graph.prototype.clearData = function () {
  this.xValues = [];
  this.yValues = [];
  this.mark = null;
};

D3Graph.prototype.setMark = function (mark) {
  this.mark = mark;
};

/**
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

/**
 * グラフを削除する
 */
D3Graph.prototype.remove = function () {
  this.d3.select("#log-renderer-nav-graph>div#"+this.key).remove();
};

/**
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
  this.markLine
    .x(function(d,i){return this.xScale(this.xValues[this.mark]);}.bind(this))
    .y(function(d){return d;}.bind(this))
    .interpolate("linear");

  // brushオブジェクトにスケールを設定
  this.brush
    .x(this.xScale)
    .y(this.yScale);

  // 軸にスケールを設定
  this.xAxis.scale(this.xScale);
  this.yAxis.scale(this.yScale);
};

/**
 * 現在のスケール設定に従ってグラフを描画する
 */
D3Graph.prototype.render = function () {
  // SVG 要素追加
  if (this.d3.select("#log-renderer-nav-graph>div#" + this.key).empty()) {
    this.d3.select("#log-renderer-nav-graph")
      .append("div")
      .attr('class', 'graph-chart')
      .attr('id', this.key);
    this.d3.select("#log-renderer-nav-graph>div#"+this.key)
      .append("text")
      .attr("class", "graph-chart-title")
      .text(this.key);
    this.d3.select("#log-renderer-nav-graph>div#"+this.key)
      .append("svg")
      .attr('class', 'graph-chart-svg')
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

  // マークの描画
  this.renderMark();
};

D3Graph.prototype.renderMark = function () {
  var svg = this.d3.select("svg#"+this.key);
  // マークの描画
  if (this.mark == null) {return;}
  svg.selectAll("path.mark").remove();
  svg.append("path")
    .attr("class", "mark")
    .attr("d", this.markLine([this.svgElementHeight - this.paddingBottom, this.paddingTop + this.titleSpaceHeight]))
    .attr("stroke", "red")
    .attr("fill", "none");
};

D3Graph.prototype.addLabel = function () {
  var svg = this.d3.select("svg#"+this.key);
  svg.selectAll("text")
    .data(this.yValues)
    .enter()
    .append("text")
    .text(function(d) { return d; })
    .attr("x", function(d, i) {
      return this.xScale(this.xValues[i]);
    }.bind(this))
    .attr("y", function(d) {
      return this.yScale(d);
    }.bind(this))
    .attr('opacity', function(d, i) {
      if (i == 0) {
        return 1;
      }
      // 直前の値との差分から，ラベルを表示するかしないか決める
      if (this.yValues[i] - this.yValues[i-1] < this.labelRenaderIntarval) {
        return 0;
      } else {
        return 1;
      }
    }.bind(this))
    .attr("font-family", "sans-serif")
    .attr("font-size", "11px")
    .attr("fill", "black");
};

D3Graph.prototype.addBrush = function () {
  var svg = this.d3.select("svg#"+this.key);

  /* --------- brush ------------ */
  /*
   * brushオブジェクトを追加する
   * brushは透明なrectをグループ上設置しマウスイベントを取得する。
   * 設置したrect上ではドラッグで範囲選択が可能
   * 範囲が選択されている状態でbrush.extent()メソッドを実行するとその範囲のデータ値を返す
   */

  var brushGroup = svg.append("g")
        .attr("class", "brush")
        .call(this.brush);

  var rect = brushGroup
    .selectAll("rect")
    .attr("height", this.graphHeight)
    .style({
      "fill": "#69f",
      "fill-opacity": "0.3"
    });

  brushGroup.selectAll(".resize").remove();

  this.brush.on("brushend", brushed.bind(this));

  function brushed () {
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
    this.renderMark();
    var rect = this.addBrush();
    this.addFocus(rect);
    this.addMarkEvent(rect);

    // brushオブジェクト上の矩形を消す
    this.d3.select('svg#'+this.key).select('.extent')
      .attr({width: 0, height: 0, x: 0, y: 0});
  }

  // 背景の rect を返す
  // サイズは SVG 要素と同じになっているみたい
  // 他の rect を上に重ねると動作しなくなるため，この rect に対して
  // 要素を追加していけば良い
  var backGroundRect = brushGroup.select("rect.background");
  this.addFocus(backGroundRect);

  /* --------------------------- */

  return rect;
};

D3Graph.prototype.addMarkEvent = function (rect) {
  var self = this;
  rect.on("mousedown", function() {
    // 右クリックの時は動作を止める
    if (this.d3.event.button === 2) { // only enable for right click
      this.d3.event.stopImmediatePropagation();
    }
  }.bind(this))
    .on("contextmenu", function (d, i) {
      // 右クリック時の処理
      self.d3.event.preventDefault();

      var mouseXPos = self.xScale.invert(self.d3.mouse(this)[0]),
          leftSideIndex = self.bisectXValue(self.xValues, mouseXPos, 1),
          leftSideXData = self.xScale[leftSideIndex - 1],
          rightSideXData = self.xScale[leftSideIndex],
          index = mouseXPos - leftSideXData > rightSideXData - mouseXPos ? leftSideIndex-1 : leftSideIndex;

      self.renderer.setMark(index);
    });
};

D3Graph.prototype.addFocus = function (rect) {
  var svg = this.d3.select("svg#"+this.key);

  if (rect == null) {
    // 追加する rect が存在しなければ，新たに rect 要素を追加する
    svg.selectAll("rect.focus_overlay").remove();
    rect = svg.append("rect")
      .attr("class", "focus_overlay")
      .attr('opacity', 0)
      .attr("width", this.svgElementWidth)
      .attr("height", this.svgElementHeight);
  }

  svg.selectAll("g.focus").remove();
  var focus = svg.append("g")
        .attr("class", "focus")
        .style("display", "none");

  focus.append("circle")
    .attr("r", 4.5);

  focus.append("text")
    .attr("x", 9)
    .attr("dy", ".35em");

  rect
    .on("mouseover", function() { focus.style("display", null); })
    .on("mouseout", function() { focus.style("display", "none"); })
    .on("mousemove", mousemove);

  var xScale_ = this.xScale;
  var yScale_ = this.yScale;
  var xValues_ = this.xValues;
  var yValues_ = this.yValues;
  var bisectXValue_ = this.bisectXValue;
  var d3_ = this.d3;

  function mousemove() {
    var mouseXPos = xScale_.invert(d3_.mouse(this)[0]),
        leftSideIndex = bisectXValue_(xValues_, mouseXPos, 1),
        leftSideXData = xScale_[leftSideIndex - 1],
        rightSideXData = xScale_[leftSideIndex],
        index = mouseXPos - leftSideXData > rightSideXData - mouseXPos ? leftSideIndex-1 : leftSideIndex;
    focus.attr("transform", "translate(" + xScale_(xValues_[index]) + "," + yScale_(yValues_[index]) + ")");
    focus.select("text").text("(" + xValues_[index] + ", " + yValues_[index] + ")");
  }
};

module.exports = D3Graph;
