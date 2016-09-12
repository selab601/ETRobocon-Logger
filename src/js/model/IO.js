/*
 * IO.js
 * MainProcess, RendererProcess 間の通信関係の関数定義
 */
"use-strict";

function IO (view, main) {
  this.ipc = require('electron').ipcRenderer;
  this.view = view;
  this.main = main;

  // 受信

  this.ipc.on('BTDevice', function (ev, message) {
    this.main.addDevices(message);
  }.bind(this));

  this.ipc.on('disconnected', function (ev, message) {
    this.main.updateConnectionState(false);
    this.view.showModal(message);
  }.bind(this));

  this.ipc.on('connected', function (ev, message) {
    this.main.updateConnectionState(true);
    this.view.showModal(message);
  }.bind(this));

  this.ipc.on('cannotConnected', function (ev, message) {
    this.main.updateConnectionState(false);
    this.view.showModal(message);
  }.bind(this));

  this.ipc.on('deviceNotFound', function (ev, message) {
    this.main.updateConnectionState(false);
    this.view.showModal(message);
  }.bind(this));

  this.ipc.on('finishFindingDevice', function (ev, message) {
    this.view.showModal(message);
  }.bind(this));

  this.ipc.on('ReceiveDataFromBTDevice', function (ev, message) {
    this.main.renderDynamicGraph(message);
  }.bind(this));
}

// 送信

IO.prototype.disconnect = function () {
  this.view.showDialog('Disconnecting...');
  this.ipc.send('disconnect', '');
};

IO.prototype.connect = function (address) {
  this.view.showDialog('Connecting...');
  this.ipc.send('connectBTDevice', address);
};

IO.prototype.findDevice = function () {
  this.view.showDialog('Finding...');
  this.ipc.send('findBTDevice', '');
};

IO.prototype.appendReceiver = function (event, func) {
  this.ipc.on(event, (ev,msg) => func(ev, msg));
};

module.exports = IO;
