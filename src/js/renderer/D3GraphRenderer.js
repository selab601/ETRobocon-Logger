/*
 * D3GraphRenderer.js
 * 複数のグラフをとりまとめて管理するモジュール
 */
"use-strict";

var D3Graph = require("./D3graph.js");

function D3GraphRenderer ( all_keymap, render_value_keymap, range, dom_id ) {
  this.all_keymap = all_keymap;
  this.render_value_keymap = render_value_keymap;
  this.range = range;
  this.dom_id = dom_id;

  this.graphMap = {};
  this.all_keymap.forEach( function ( key ) {
    this.graphMap[ key ] = new D3Graph( key, this, this.range, this.dom_id );
  }.bind(this));
};

D3GraphRenderer.prototype.initialize = function () {
  Object.keys( this.graphMap ).forEach( function ( key ) {
    this.graphMap[key].clearData();
    this.graphMap[key].resetStyle();
  }.bind(this));
  this.removeAll();
};


/***** グラフの操作 *****/

D3GraphRenderer.prototype.update = function (key, xValue, yValue) {
  this.graphMap[key].appendData(xValue, yValue);
};

D3GraphRenderer.prototype.renderAll = function (xScope, yScope) {

  this.render_value_keymap.forEach( function ( key ) {
    this.graphMap[key].updateScale(xScope, yScope);
    this.graphMap[key].render();
  }.bind(this));
};

D3GraphRenderer.prototype.removeAll = function () {
  Object.keys( this.graphMap ).forEach( function ( key ) {
    this.graphMap[key].remove();
  }.bind(this));
};

D3GraphRenderer.prototype.remove = function ( key ) {
  this.graphMap[key].remove();
};

/************************/


/***** グラフへの性質の追加 *****/

D3GraphRenderer.prototype.addBrush = function () {
  this.all_keymap.forEach( function ( key ) {
    this.graphMap[key].addBrush();
  }.bind(this));
};

D3GraphRenderer.prototype.addLabel = function () {
  this.all_keymap.forEach( function ( key ) {
    this.graphMap[key].addLabel();
  }.bind(this));
};

D3GraphRenderer.prototype.addFocus = function () {
  this.all_keymap.forEach( function ( key ) {
    this.graphMap[key].addFocus();
  }.bind(this));
};

D3GraphRenderer.prototype.setMark = function (mark) {
  Object.keys(this.graphMap).forEach(function(key) {
    this.graphMap[key].setMark(mark);
  }.bind(this));

  for (var i=0; i<this.render_value_keymap.length; i++) {
    this.graphMap[this.render_value_keymap[i]].renderMark();
  }
};

/********************************/


module.exports = D3GraphRenderer;
