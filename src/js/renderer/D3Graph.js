/*
 * D3Graph.js
 * グラフ描画のためのモジュール
 */
"use-strict";

// 各種デフォルト設定値
const SVG_ELEMENT_HEIGHT = 270;
const SVG_ELEMENT_WIDTH  = 700;
const TITLE_SPACE_HEIGHT = 20;
const PADDING_LEFT       = 40;
const PADDING_RIGHT      = 10;
const PADDING_TOP        = -15;
const PADDING_BOTTOM     = 40;
const GRAPH_HEIGHT       = SVG_ELEMENT_HEIGHT - (PADDING_TOP+PADDING_BOTTOM) - TITLE_SPACE_HEIGHT;
const GRAPH_WIDTH        = SVG_ELEMENT_WIDTH - (PADDING_LEFT+PADDING_RIGHT);

/**
 * グラフ
 *
 * @param key              描画対象の値の種類を識別するキー
 * @param maxXValueLength  描画範囲．ここで指定された描画範囲よりも多くのデータが
 *                         追加されようとした場合，古いデータから抜け落ちてゆく
 *                         制限したくない場合は，null を指定する
 * @param append_target_id グラフを追加する対象の DOM の ID
 * @param onRenderMarkOnOtherGraphs     マーク付加イベントが発生した際に，全てのグラフにマークの描画
 *                                      を支持するためのコールバック関数
 */
function D3Graph( key, maxXValueLength, append_target_id, onRenderMarkOnOtherGraphs ) {
  /*** レイアウト値 ***/
  this.svgElementHeight = SVG_ELEMENT_HEIGHT;
  this.svgElementWidth  = SVG_ELEMENT_WIDTH;
  this.titleSpaceHeight = TITLE_SPACE_HEIGHT;
  this.paddingLeft      = PADDING_LEFT;
  this.paddingRight     = PADDING_RIGHT;
  this.paddingTop       = PADDING_TOP;
  this.paddingBottom    = PADDING_BOTTOM;
  this.graphHeight      = GRAPH_HEIGHT;
  this.graphWidth       = GRAPH_WIDTH;

  this.maxXValueLength  = maxXValueLength;
  this.key              = key;
  this.append_target_id = append_target_id;
  this.onRenderMarkOnOtherGraphs = onRenderMarkOnOtherGraphs;
  this.onRenderMarkOnMap = undefined;

  // グラフの描画に関係する値
  this.xValues          = [];
  this.yValues          = [];

  // d3Object のキャッシュ用
  this.d3ObjectsMap     = {};

  // ラベルの描画間隔
  // TODO: 可変にする
  this.labelInterval    = 5;

  this.d3 = require('../lib/d3.min.js');

  this.bisectXValue = this.d3.bisector(function(d) { return d; }).left,

  // スケールの初期化
  this.xScale = this.d3.scale.linear()
    .range([this.paddingLeft, this.svgElementWidth - this. paddingRight]);
  this.yScale = this.d3.scale.linear()
    .range([this.svgElementHeight - this.paddingBottom, this.paddingTop + this.titleSpaceHeight]);

  /***** 各種線分，要素の描画のための関数 *****/
  //** パス **//
  this.line         = this.d3.svg.line();
  // スケール設定
  this.line
    .x(function(d,i){return this.xScale(this.xValues[i]);}.bind(this))
    .y(function(d,i){return this.yScale(d);}.bind(this))
    .interpolate("linear");

  //** マーク **//
  this.markLine     = this.d3.svg.line();
  this.mark_index   = null;
  // スケール設定
  this.markLine
    .x(function(d,i){return this.xScale(this.xValues[this.mark_index]);}.bind(this))
    .y(function(d){return d;}.bind(this))
    .interpolate("linear");

  //** brush オブジェクト **//
  this.brush        = this.d3.svg.brush();
  // スケール設定
  this.brush
    .x(this.xScale)
    .y(this.yScale);

  //** X軸，Y軸 **//
  this.xAxis        = this.d3.svg.axis()
    .orient('bottom')
    .innerTickSize(-this.graphHeight)  // 目盛線の長さ（内側）
    .outerTickSize(5)                  // 目盛線の長さ（外側）
    .tickPadding(10);                  // 目盛線とテキストの間の長さ
  this.yAxis        = this.d3.svg.axis()
    .orient('left')
    .innerTickSize(-this.graphWidth)   // 目盛線の長さ（内側）
    .outerTickSize(5)                  // 目盛線の長さ（外側）
    .tickPadding(10);                  // 目盛線とテキストの間の長さ
  // スケール設定
  this.xAxis.scale(this.xScale);
  this.yAxis.scale(this.yScale);
};


/***** グラフの描画内容の変更 *****/

/**
 * 描画データを追加する
 */
D3Graph.prototype.appendData = function (xData, yData) {
  // X 値の最大保持数が設定されている場合は，値の切り捨て判定/処理を行う
  if ( this.maxXValueLength !== null ) {
    if ( this.xValues.length > this.maxXValueLength ) {
      this.xValues.shift();
      this.yValues.shift();
    }
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
  this.mark_index = null;
};

/**
 * グラフのスケールを設定する
 *
 * @param 描画するX軸の範囲を開始値と終了値の配列で示したもの 例) [ 開始値, 終了値 ]
 *        null を指定した場合，データ内の先頭の値，末尾の値が各々自動的に選択される
 * @param 描画するY軸の範囲を開始値と終了値の配列で示したもの 例) [ 開始値, 終了値 ]
 *        null を指定した場合，データ内の最小値，最大値にマージンを加えたものが選択される
 *
 * TODO: Y 値のマージンを可変にする
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

/************************/


/***** グラフの描画 *****/

/**
 * 描画の初期化
 *
 * グラフ描画の内，更新が必要ない描画部分は最初のみ描画する
 * 例えば，グラフのタイトル等
 * また，描画した各要素はキャッシュする．
 */
D3Graph.prototype.initialRender = function () {
  this.d3.select("#"+this.append_target_id)
    .append("div")
    .attr('class', 'graph-chart')
    .attr('id', this.key);
  var div = this.d3.select("#"+this.append_target_id+">div#"+this.key);
  div
    .append("text")
    .attr("class", "graph-chart-title")
    .text(this.key);
  div
    .append("svg")
    .attr('class', 'graph-chart-svg')
    .attr('id', this.key)
    .attr("width", this.svgElementWidth)
    .attr("height", this.svgElementHeight);
  var svg = this.d3.select("svg#"+this.key);

  svg.append("path")
    .attr("id", this.key)
    .attr("stroke", "steelblue")
    .attr("fill", "none");
  svg.append('g')
    .attr("class", "axis")
    .attr("id", this.key+"-x-axis");
  svg.append('g')
    .attr("class", "axis")
    .attr("id", this.key+"-y-axis");

  this.d3ObjectsMap = {
    div  : div,
    svg  : svg,
    path : svg.select("path#"+this.key),
    xG   : svg.select("g#"+this.key+"-x-axis"),
    yG   : svg.select("g#"+this.key+"-y-axis")
  };
};

/**
 * グラフを DOM 要素に描画する
 */
D3Graph.prototype.render = function () {
  // グラフ自体がまだ存在しなければ，描画する
  if (this.d3.select("#"+this.append_target_id+">div#"+this.key).empty()) {
    this.initialRender();
  }

  // パスの再描画
  this.d3ObjectsMap.path
    .attr("d", this.line(this.yValues));
  // X軸，Y軸の再描画
  this.d3ObjectsMap.xG
    .attr("transform", "translate(0," + ( this.svgElementHeight - this.paddingBottom ) + ")")
    .call(this.xAxis);
  this.d3ObjectsMap.yG
    .attr("transform", "translate(" + this.paddingLeft + ",0)")
    .call(this.yAxis);

  // マークの描画
  this.onRenderMark();
};

/**
 * グラフを DOM 要素から削除する
 */
D3Graph.prototype.remove = function () {
  if ( this.d3ObjectsMap.div === undefined ) { return; }
  this.d3ObjectsMap.div.remove();
  this.d3ObjectsMap = {};
};

/************************/


/***** グラフへの性質の追加 *****/

/**
 * Blush の追加
 *
 * brushオブジェクトを追加する
 * blush は透明な rect であり，マウスイベントを取得する．
 * blush オブジェクト上でドラッグすると，ドラッグ範囲を選択できる．
 * 範囲が選択されている状態でbrush.extent()メソッドを実行するとその範囲のデータ値を返す
 */
D3Graph.prototype.addBrush = function () {
  // TODO: ここの条件分岐は addBrush を呼び出す側で行うべき
  if ( this.d3ObjectsMap.brush_object === undefined ) {
    var brush_object = this.d3ObjectsMap.svg
        .append("g")
        .attr("class", "brush")
        .call(this.brush);
    brush_object
        .selectAll("rect")
        .style({
          "fill": "#69f",
          "fill-opacity": "0.3"
        });
    brush_object.selectAll(".resize").remove();
    this.brush.on("brushend", onBrushed.bind(this));

    this.d3ObjectsMap.brush_object      = brush_object;
    this.d3ObjectsMap.brush_object_rect = brush_object.select("rect.background");
  }
};

/**
 * Brush オブジェクトの背景である RECT 要素を取得する
 */
D3Graph.prototype.getBrushRect = function () {
  return this.d3ObjectsMap.brush_object_rect;
};

/**
 * brush 処理時に呼び出されるイベントハンドラ
 */
function onBrushed () {
  // 領域選択の座標， 左上座標: (xStart, yStart), 右下座標: (xEnd, yEnd)
  var xStart = this.brush.extent()[0][0];
  var xEnd   = this.brush.extent()[1][0];
  var yStart = this.brush.extent()[0][1];
  var yEnd   = this.brush.extent()[1][1];

  // 開始点と終了点が同じ = 単純なクリック の場合は，デフォルトのスケールに戻す
  // それ以外の場合は，スケールを更新する
  if (xStart == xEnd && yStart == yEnd) {
    this.updateScale();
  } else {
    this.updateScale([xStart, xEnd], [yStart, yEnd]);
  }

  // 再描画
  // TODO: 再描画の設定は描画ごとに異なるため，ここは別処理に切り出したい．
  this.render();
  this.onRenderMark();
  this.addBrush();
  // 背景の rect を返す
  // サイズは SVG 要素と同じになっているみたい
  // 他の rect を上に重ねると動作しなくなるため，この rect に対して
  // 要素を追加していけば良い
  var brush_object_rect = this.d3ObjectsMap.brush_object_rect;
  this.addFocus(brush_object_rect);
  this.addMarkEvent(brush_object_rect);

  // brushオブジェクト上の矩形を消す
  this.d3ObjectsMap.svg.select('.extent')
    .attr({width: 0, height: 0, x: 0, y: 0});
}

/**
 * ラベルの追加
 *
 * ラベルは，グラフ上の各値に対し，その Y 値を表したものであり，
 * グラフ上の値の近傍に描画される．
 * 全ての値にラベルを描画すると見辛いので，時間軸上の前後の Y 値
 * の差分が一定以上の場合のみ描画する．
 * この時の「一定」の値は，「labelRenderIntarval」プロパティに定められている．
 *
 * TODO: 毎回全ラベルを削除していると処理が重くなるのでどうにかする
 */
D3Graph.prototype.addLabel = function () {
  var svg = this.d3ObjectsMap.svg;
  if ( svg === undefined ) { return; }

  svg.selectAll("text").remove();
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
      if (this.yValues[i] - this.yValues[i-1] < this.labelInterval) {
        return 0;
      } else {
        return 1;
      }
    }.bind(this))
    .attr("font-family", "sans-serif")
    .attr("font-size", "11px")
    .attr("fill", "black");
};

/**
 * フォーカスの追加
 *
 * フォーカスは，グラフ上の各値の詳細を表示する機能
 * グラフにマウスを重ねると，直近の要素の x, y 値がグラフ上に描画される
 *
 * @param フォーカスを追加する対象のrect要素．指定がない場合は追加する．
 */
D3Graph.prototype.addFocus = function ( target_rect ) {
  var svg = this.d3ObjectsMap.svg;
  if ( svg === undefined ) { return; }

  var rect = target_rect;
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

/**
 * マークの描画イベントを追加する
 *
 * @param target_rect マークを追加する対象の rect 要素
 */
D3Graph.prototype.addMarkEvent = function ( target_rect ) {

  var rect = target_rect;
  if (rect == null) {
    // 追加する rect が存在しなければ，新たに rect 要素を追加する
    rect = svg.append("rect")
      .attr("class", "mark_overlay")
      .attr('opacity', 0)
      .attr("width", this.svgElementWidth)
      .attr("height", this.svgElementHeight);
  }

  var self = this;
  rect.on("mousedown", function() {
    // 右クリックの時は動作を止める
    if (this.d3.event.button === 2) {
      this.d3.event.stopImmediatePropagation();
    }
  }.bind(this))
    .on("contextmenu", function (d, i) {
      // 右クリック時の処理
      self.d3.event.preventDefault();

      // マークを付加する場所の決定
      // クリック地点から一番近いX座標を index として保持し，
      // それをもってして全グラフに描画を促す
      var mouseXPos      = self.xScale.invert(self.d3.mouse(this)[0]),
          leftSideIndex  = self.bisectXValue(self.xValues, mouseXPos, 1),
          leftSideXData  = self.xScale[leftSideIndex - 1],
          rightSideXData = self.xScale[leftSideIndex],
          index          = mouseXPos - leftSideXData > rightSideXData - mouseXPos ? leftSideIndex-1 : leftSideIndex;

      // マークを描画する
      self.onRenderMark( index );
      // 他の全グラフにもマークを描画する
      self.onRenderMarkOnOtherGraphs( index );
      // マップにもマークを描画する
      if ( self.onRenderMarkOnMap != undefined ) {
        self.onRenderMarkOnMap( index );
      }
    });
};

/**
 * マークを設定する
 *
 * 必ずしも全グラフを描画するわけではないので，マークの設定と描画の処理は別にする
 */
D3Graph.prototype.setMark = function (mark) {
  this.mark_index = mark;
};

/**
 * マークを描画する
 *
 * 必ずしも全グラフを描画するわけではないので，マークの設定と描画の処理は別にする
 * mark_index はデータの index を示しているだけで，描画されるマークの要素自体は
 * this.markLine である．
 * markLine にはX軸方向の描画に対してコールバック関数が登録されており，
 * this.mark_index が更新されると自動的に描画位置も更新される．
 * そのため，この関数内で描画位置の更新等を行う必要はない．
 *
 * <markLine に登録されているコールバック関数>
 * this.markLine
 *   .x(function(d,i){return this.xScale(this.xValues[this.mark_index]);}.bind(this))
 *   .y(function(d){return d;}.bind(this))
 *   .interpolate("linear");
 */
D3Graph.prototype.onRenderMark = function () {
  var svg = this.d3ObjectsMap.svg;
  if ( svg === undefined ) { return; }

  if ( this.mark_index == null ) { return; }

  svg.selectAll("path.mark").remove();
  svg.append("path")
    .attr("class", "mark")
    .attr("d", this.markLine([this.svgElementHeight - this.paddingBottom, this.paddingTop + this.titleSpaceHeight]))
    .attr("stroke", "red")
    .attr("fill", "none");
};

/**
 * マップにマークを反映させるためのイベントハンドラを設定する
 */
D3Graph.prototype.setOnRenderMarkOnMap = function ( handler ) {
  this.onRenderMarkOnMap = handler;
};


module.exports = D3Graph;
