/**
 * Bluetooth デバイスとの通信機能モジュール
 */

function bluetoothConnector () {
  this.configMap = {
    main_html : (function () {
      /*
        <div id="device-list">
          <div class="sidebar-header">
            Devices
          </div>
          <div class="sidebar-content">
            <ul class="nav nav-pills nav-stacked" id="bt-device-group">
            <!-- デバイスが追加されていく -->
            </ul>
            <div class="button-area-line">
              <a href="#" class="button" id="update-btn">UPDATE</a>
              <a href="#" class="button danger" id="disconnect-btn">DISCONNECT</a>
            </div>
          </div>
        </div>
      */}).toString().replace(/(\n)/g, '').split('*')[1]
  };
  this.stateMap = {
    $append_target : undefined,
    isConnected : false,
    deviceMap: []
  };
  this.jqueryMap = {};
  this.ipc = require('electron').ipcRenderer;

  this.$ = require('./model/lib/jquery-3.1.0.min.js');
};

/******* イベントハンドラ *******/

bluetoothConnector.prototype.onUpdateDevices = function () {
  this.ipc.send('updateDevices', '');
};

bluetoothConnector.prototype.onUpdateDevicesFailed = function ( ev, message ) {
  console.log(message);
};

bluetoothConnector.prototype.onUpdateDevicesComplete = function ( ev, message ) {
  var device = message;

  console.log("found: " + device.name + ", " + device.address);

  // リストに追加済みであったなら追加しない
  this.stateMap.deviceMap.forEach(function (d) {
    if ( d.address === device.address ) { return; }
  });
  this.stateMap.deviceMap.push(device);

  this.jqueryMap.$bt_device_group.append(
    this.$('<li>').append(
      this.$("<a/>")
        .attr("href", "#")
        .text(device.name)
        .bind( 'click', device.address, this.onConnectDevice.bind(this) )));
};

bluetoothConnector.prototype.onConnectDevice = function ( event ) {
  console.log(event.data);
  this.ipc.send('connectDevice', event.data);
};

bluetoothConnector.prototype.onConnectDeviceComplete = function ( ev, message ) {
  console.log(message);
  this.stateMap.isConnected = true;
};

bluetoothConnector.prototype.onConnectDeviceFailed = function ( ev, message ) {
  console.log(message);
};

bluetoothConnector.prototype.onDisconnectDevice = function () {
  if ( this.stateMap.isConnected == false ) { return; }
  // TODO: ログファイル名の取得
  this.ipc.send('disconnectDevice', 'log-file-name');
};

bluetoothConnector.prototype.onDisconnectDeviceComplete = function ( ev, message ) {
  console.log(message);
  this.stateMap.isConnected = false;
};

/********************************/

bluetoothConnector.prototype.setJqueryMap = function () {
  var $append_target = this.stateMap.$append_target;
  this.jqueryMap = {
    $append_target: $append_target,
    $bt_device_group : $append_target.find("#bt-device-group"),
    $update_btn : $append_target.find("#update-btn"),
    $disconnect_btn : $append_target.find("#disconnect-btn")
  };
};

bluetoothConnector.prototype.initModule = function ( $append_target ) {
  this.stateMap.$append_target = $append_target;
  $append_target.html( this.configMap.main_html );
  this.setJqueryMap();

  // イベントハンドラの登録

  this.jqueryMap.$update_btn.bind( 'click', this.onUpdateDevices.bind(this));
  this.jqueryMap.$disconnect_btn.bind( 'click', this.onDisconnectDevice.bind(this));

  this.ipc.on('updateDevicesComplete', this.onUpdateDevicesComplete.bind(this));
  this.ipc.on('updateDevicesFailed', this.onUpdateDevicesFailed.bind(this));
  this.ipc.on('connectDeviceComplete', this.onConnectDeviceComplete.bind(this));
  this.ipc.on('connectDeviceFailed', this.onConnectDeviceFailed.bind(this));
  this.ipc.on('disconnectDeviceComplete', this.onDisconnectDeviceComplete.bind(this));
};

module.exports = bluetoothConnector;
