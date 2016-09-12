/*
 * ApplicationModel.js
 */
"use-strict";

function ApplicationModel () {
  // アプリケーションの状態を保持する
  this.connected = false;
  this.renderValues = [];
  this.connectedDevices = [];
  // 後で消す．現在表示しているページを保持する変数
  this.content = "";

  this.receiveValueKinds = [
    "clock", "gyro", "touch", "sonar", "brightness",
    "rgb_r", "rgb_g", "rgb_b", "hsv_h", "hsv_s", "hsv_v",
    "arm_count", "left_count", "right_count",
    "length", "angle", "coordinate_x", "coordinate_y"
  ];

  this.history = {};
  for (var i=0; i<this.receiveValueKinds.length; i++) {
    this.history[this.receiveValueKinds[i]] = [];
  }
};

ApplicationModel.prototype.getShownContent = function () {
  return this.content;
};

ApplicationModel.prototype.setShownContent = function (content) {
  this.content = content;
};

ApplicationModel.prototype.getReceiveValueKinds = function () {
  return this.receiveValueKinds;
};

ApplicationModel.prototype.getHistory = function (key) {
  return this.history[key];
};

ApplicationModel.prototype.appendHistory = function (key, value) {
  this.history[key].push(value);
};

ApplicationModel.prototype.addConnectedDevices = function (device) {
  // アドレスが同じ場合は保持しない
  for (var i=0; i<this.connectedDevices.length; i++) {
    if (device.address == this.connectedDevices[i].address) {
      return;
    }
  }
  this.connectedDevices.push(device);
};

ApplicationModel.prototype.getConnectedDevices = function () {
  return this.connectedDevices;
};

ApplicationModel.prototype.setRenderValueKinds = function (kinds) {
  this.renderValues = kinds;
};

ApplicationModel.prototype.updateConnectionState = function (state) {
  this.connected = state;
};

ApplicationModel.prototype.setRenderValues = function (kinds) {
  this.renderValues = kinds;
};

ApplicationModel.prototype.getRenderValues = function () {
  return this.renderValues;
};

module.exports = ApplicationModel;
