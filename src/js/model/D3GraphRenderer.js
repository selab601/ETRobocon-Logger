/*
 * D3GraphRenderer.js
 * 複数のグラフをとりまとめて管理するモジュール
 */
"use-strict";

var D3Graph = require("./D3graph.js");

function D3GraphRenderer ( keymap ) {
  this.keymap = [];
  keymap.forEach( function ( data ) {
    this.keymap.push(data.id);
  }.bind(this));

  this.receiveValues = {};
  this.keymap.forEach( function ( key ) {
    this.receiveValues[ key ] = new D3Graph( key, this);
  }.bind(this));
};

D3GraphRenderer.prototype.initialize = function () {
  Object.keys(this.receiveValues).forEach(function(key) {
    this.receiveValues[key].clearData();
    this.receiveValues[key].resetStyle();
  }.bind(this));
  this.removeAllGraph();
};

D3GraphRenderer.prototype.removeAllGraph = function () {
  Object.keys(this.receiveValues).forEach(function(key) {
    this.receiveValues[key].remove();
  }.bind(this));
};

D3GraphRenderer.prototype.setMark = function (mark) {
  Object.keys(this.receiveValues).forEach(function(key) {
    this.receiveValues[key].setMark(mark);
  }.bind(this));

  for (var i=0; i<this.keymap.length; i++) {
    this.receiveValues[this.keymap[i]].renderMark();
  }
};

D3GraphRenderer.prototype.getReceiveValuesList = function () {
  return Object.keys(this.receiveValues);
};

D3GraphRenderer.prototype.update = function (key, xValue, yValue) {
  this.receiveValues[key].appendData(xValue, yValue);
};

D3GraphRenderer.prototype.renderAll = function (xScope, yScope) {
  this.removeAllGraph();
  for (var i=0; i<this.keymap.length; i++) {
    this.receiveValues[this.keymap[i]].updateScale(xScope, yScope);
    this.receiveValues[this.keymap[i]].render();
  }
};

D3GraphRenderer.prototype.addBrush = function () {
  for (var i=0; i<this.keymap.length; i++) {
    this.receiveValues[this.keymap[i]].addBrush();
  }
};

D3GraphRenderer.prototype.addLabel = function () {
  for (var i=0; i<this.keymap.length; i++) {
    this.receiveValues[this.keymap[i]].addLabel();
  }
};

D3GraphRenderer.prototype.addFocus = function () {
  for (var i=0; i<this.keymap.length; i++) {
    this.receiveValues[this.keymap[i]].addFocus();
  }
};

module.exports = D3GraphRenderer;
