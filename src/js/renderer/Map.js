function Map ( $append_target_id, width, height, origin, drawScale ) {
  this.append_target_id = $append_target_id;

  this.width  = width;
  this.height = height;
  this.origin = origin;
  this.drawScale  = drawScale;
  this.preCor = null;

  // D3 オブジェクトキャッシュ用
  this.d3ObjectsMap = {};

  // D3.js
  this.d3 = require('../lib/d3.min.js');
  // path を生成するためのジェネレータの設定
  this.line = this.d3.svg.line()
    .x(function(d) {return d.x;})
    .y(function(d) {return d.y;})
    .interpolate("cardinal");

  // グラフのツールチップ
  this.toolTip = this.d3.select("."+this.append_target_id)
    .append("div")
    .attr("class", "map-chart-tooltip");

  // スケールの初期化
  this.xScale = this.d3.scale.linear()
    .range([0, this.width]);
  this.yScale = this.d3.scale.linear()
    .range([this.height, 0]);
};

Map.prototype.init = function () {
  if ( this.d3.select("svg.map-chart-svg").empty() == false ) {
    this.d3.select("svg.map-chart-svg").remove();
  }

  this.d3.select("."+this.append_target_id)
    .append("svg")
    .attr('class', 'map-chart-svg')
    .attr("width", this.width)
    .attr("height", this.height);
  var svg = this.d3.select("svg.map-chart-svg");

  // TODO: 原点 = スタート地点で良いか？
  this.preCor = {
    x: this.origin.x,
    y: this.origin.y
  };

  this.d3ObjectsMap = { svg : svg };
};

/**
 * 複数回に分けてマップを描画する
 * この関数を呼び出す前に，必ず init 関数を呼び出し初期化を行わなければならない．
 * また，描画を開始する原点を setOrigin で事前に設定しておくこと
 * 引数として座標を与えると，前回与えた座標から今回与えた座標までの線分を描画する．
 *
 * @param coordinate 次の座標({x:<number>,y:<number>})
 */
Map.prototype.render = function ( coordinate ) {
  var adjustedCor = {
    x: coordinate.x,
    y: coordinate.y
  };

  // スケールに合わせる
  if ( this.drawScale != undefined ) {
    adjustedCor.x /= this.drawScale;
    adjustedCor.y /= this.drawScale;
  }

  // 原点に合わせる
  adjustedCor.x += this.origin.x;
  adjustedCor.y += this.origin.y;

  if ( this.preCor == null ) {
    this.preCor = adjustedCor;
    return;
  }

  this.d3ObjectsMap.svg
    // 線を描画
    .append("path")
    .datum([ this.preCor, adjustedCor ])
    .attr("class", "line")
    .attr("d", this.line);
  var self = this;
  this.d3ObjectsMap.svg
    // 円を描画
    .append("circle")
    .attr("r", 3)
    .attr("cx", adjustedCor.x)
    .attr("cy", adjustedCor.y)
    .attr("fill","rgb(255, 0, 0)")
    .on("mouseover", function() { // マウスオーバー時にツールチップを表示
      self.toolTip
        .style("left", adjustedCor.x + "px" )
        .style("top", adjustedCor.y - 23 + "px")
        .style("visibility","visible")
        .text( parseInt(adjustedCor.x)  + ", " + parseInt(adjustedCor.y) );
    })
    .on("mouseout", function(d) { // マウスアウトするとツールチップを非表示
      self.toolTip.style("visibility","hidden");
    });

  this.preCor = adjustedCor;
};

/**
 * 1まとまりのデータを Map として描画する
 *
 * @param data 座標({x:<number>,y:<number>})の配列
 */
Map.prototype.renderFromData = function ( data ) {
  this.init();

  this.d3ObjectsMap.svg.selectAll("path")
    .data( data )
    .enter()
    .append("path")
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("d", this.diagonal);
};

/**
 * マップを拡大縮小する
 *
 * @param scale 拡大縮小の倍率 (0 ~ 100)
 */
Map.prototype.scale = function ( value ) {
  this.d3ObjectsMap.svg
    .style("zoom" , value+"%");
};

module.exports = Map;
