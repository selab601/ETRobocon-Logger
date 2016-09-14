/*
 * D3GraphRenderer.js
 * グラフ描画のためのモジュール
 */
"use-strict";

var D3Graph = require("./D3graph.js");

function D3GraphRenderer (D3Object, model) {
  this.d3 = D3Object;
  this.model = model;
  this.receiveValues = {
    "clock": new D3Graph("clock", D3Object, this),
    "gyro": new D3Graph("gyro", D3Object, this),
    "touch": new D3Graph("touch", D3Object, this),
    "sonar": new D3Graph("sonar", D3Object, this),
    "brightness": new D3Graph("brightness", D3Object, this),
    "rgb_r": new D3Graph("rgb_r", D3Object, this),
    "rgb_g": new D3Graph("rgb_g", D3Object, this),
    "rgb_b": new D3Graph("rgb_b", D3Object, this),
    "hsv_h": new D3Graph("hsv_h", D3Object, this),
    "hsv_s": new D3Graph("hsv_s", D3Object, this),
    "hsv_v": new D3Graph("hsv_v", D3Object, this),
    "arm_count": new D3Graph("arm_count", D3Object, this),
    "left_count": new D3Graph("left_count", D3Object, this),
    "right_count": new D3Graph("right_count", D3Object, this),
    "length": new D3Graph("length", D3Object, this),
    "angle": new D3Graph("angle", D3Object, this),
    "coordinate_x": new D3Graph("coordinate_x", D3Object, this),
    "coordinate_y": new D3Graph("coordinate_y", D3Object, this)
  };
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

  var keys = this.model.getRenderValues();
  for (var i=0; i<keys.length; i++) {
    this.receiveValues[keys[i]].renderMark();
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
  var keys = this.model.getRenderValues();
  for (var i=0; i<keys.length; i++) {
    this.receiveValues[keys[i]].updateScale(xScope, yScope);
    this.receiveValues[keys[i]].render();
  }
};

D3GraphRenderer.prototype.addBrush = function () {
  var keys = this.model.getRenderValues();
  for (var i=0; i<keys.length; i++) {
    this.receiveValues[keys[i]].addBrush();
  }
};

D3GraphRenderer.prototype.addLabel = function () {
  var keys = this.model.getRenderValues();
  for (var i=0; i<keys.length; i++) {
    this.receiveValues[keys[i]].addLabel();
  }
};

D3GraphRenderer.prototype.addFocus = function () {
  var keys = this.model.getRenderValues();
  for (var i=0; i<keys.length; i++) {
    this.receiveValues[keys[i]].addFocus();
  }
};

module.exports = D3GraphRenderer;
