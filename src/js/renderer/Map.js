function Map ( $append_target_id ) {
  this.append_target_id = $append_target_id;

  this.margin = {top: 10, right: 40, bottom: 40, left: 100};
  this.width  = 1000 - this.margin.left - this.margin.right;
  this.height = 1000 - this.margin.top - this.margin.bottom;

  this.dataSet = [];
  this.preTarget = null;

  // D3 オブジェクトキャッシュ用
  this.d3ObjectsMap = {};

  // D3.js
  this.d3 = require('../lib/d3.min.js');
  // diagonalのpathジェネレータ設定。
  this.diagonal = this.d3.svg.diagonal();

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

  this.d3.select("#"+this.append_target_id)
    .append("svg")
    .attr('class', 'map-chart-svg')
    .attr("width", this.width)
    .attr("height", this.height);
  var svg = this.d3.select("svg.map-chart-svg");

  this.d3ObjectsMap = { svg : svg };

  this.preTarget = null;
  this.dataSet = [];
};

/**
 * 複数回に分けてマップを描画する
 * この関数を呼び出す前に，必ず init 関数を呼び出し初期化を行わなければならない．
 * また，描画を開始する原点を setOrigin で事前に設定しておくこと
 * 引数として座標を与えると，前回与えた座標から今回与えた座標までの線分を描画する．
 *
 * @param target 次の座標({x:<number>,y:<number>})
 */
Map.prototype.render = function ( target ) {
  if ( this.preTarget == null ) {
    this.preTarget = target;
    return;
  }
  var source = this.preTarget;

  this.dataSet.push( { source: source, target: target });

  // path要素で曲線を描く。
  this.d3ObjectsMap.svg.selectAll("path")
    .data(this.dataSet)
    .enter()
    .append("path")
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("d", this.diagonal);

  this.preTarget = target;
};

/**
 * 1まとまりのデータを Map として描画する
 *
 * @param data 座標({x:<number>,y:<number>})の配列
 */
Map.prototype.renderFromData = function ( data ) {
  this.init();

  this.d3ObjectsMap.svg.selectAll("path")
    .data( parse(data) )
    .enter()
    .append("path")
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("d", this.diagonal);
};

/**
 * 座標の配列を map 描画用の配列に変換する
 *
 * @param data 座標({x: <number>, y: <number>})の配列
 */
function parse( data ) {
  var result = [];
  for ( var i = 0; i < data.length-1; i++) {
    result.push( { source: data[i], target: data[i+1] } );
  }
  return result;
}

module.exports = Map;
