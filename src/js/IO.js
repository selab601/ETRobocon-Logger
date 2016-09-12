/*
 * IO.js
 * MainProcess, RendererProcess 間の通信関係の関数定義
 */
"use-strict";

function IO (view, main, model, renderer) {
  this.ipc = require('electron').ipcRenderer;
  this.view = view;
  this.model = model;
  this.main = main;
  this.renderer = renderer;

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
    var data = JSON.parse(message);

    // 値の更新
    var kinds = this.renderer.getReceiveValuesList();
    for (var i=0; i<kinds.length; i++) {
      this.renderer.update(kinds[i], data["clock"], data[kinds[i]]);
      this.model.appendHistory(kinds[i], data[kinds[i]]);
    }

    // 描画
    this.renderer.renderAll(
      this.view.checkRenderValues(),
      [data["clock"]-1000*10, data["clock"]]
    );
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
