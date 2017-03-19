/**
 * テスト用の fake デバイス接続モジュール
 */

const // main プロセス側の IPC 用モジュール
      ipcMain = require('electron').ipcMain,
      // Bluetooth デバイスの検索&通信を行うためのモジュール
      EventEmitter = require('events').EventEmitter;

function fakeConnector ( mainWindow, fileManager, model ) {
  this.mainWindow = mainWindow;
  this.fileManager = fileManager;
  this.model = model;

  this.isConnected = false;
  this.btSerial = new (require('bluetooth-serial-port')).BluetoothSerialPort(),
  this.ipc = require('electron').ipcMain;
  this.clock = 0;

  this.setEventHandlers();
}

fakeConnector.prototype.setEventHandlers = function () {
  this.ipc.on('updateDevices', (event, arg) => {
    console.log("Starting find devices...");

    var devices = [
      { name : "test1", address: "111-222-333" },
      { name : "test2", address: "334-222-333" },
      { name : "test3", address: "111-223-333" },
    ];

    var async = asyncFunc();
    async.on('done', function() {
      event.sender.send('updateDevicesFailed', {
        title: "Finish",
        body: devices.length + " devices were found"
      });

      // Bluetooth デバイスの情報を renderer プロセスに送信
      for (var i=0; i<devices.length; i++) {
        this.mainWindow.webContents.send('foundDevice', devices[i]);
      }

      // 検索完了を renderer プロセスに通知
      var devices_list_str = "";
      for ( var i = 0; i < devices.length; i++ ) {
        devices_list_str += "</br> - "+devices[i].name;
      }
      event.sender.send('updateDevicesComplete', {
        title: "Finish",
        body: devices.length + " devices were found" + devices_list_str
      });
    }.bind(this));
  });

  this.ipc.on('connectDevice', (event, arg) => {
    console.log("Connecting...");

    var address = arg;

    console.log('connected');

    event.sender.send('connectDeviceComplete', {
      title: "Cnnected!",
      body: "Successfully connected!!"
    });

    this.isConnected = true;

    // 設定をログファイルのヘッダに書き込む
    this.fileManager.appendSettings();

    // データの送信
    var callback = function () {
      var data = Math.random()*1000;
      var data_y = Math.random()*1000;
      var data_json =
        "{\"clock\":" + this.clock + ",\"gyro\":" + data + ",\"touch\":" + data  + ",\"sonar\":"+ data +","
        + "\"brightness\":" + data + ","
        + "\"rgb_r\":"+data+",\"rgb_g\":"+data+",\"rgb_b\":"+data+","
        + "\"hsv_h\":"+data+",\"hsv_s\":"+data+",\"hsv_v\":"+data+","
        + "\"arm_count\":"+data+",\"left_count\":"+data+",\"right_count\":"+data+","
        + "\"length\":"+data+",\"angle\":"+data+","
        + "\"coordinate_x\":"+data+",\"coordinate_y\":"+data_y+"}\n";
      this.clock += 100;
      this.mainWindow.webContents.send('receiveDataFromDevice', data_json);
      this.fileManager.appendData( data_json );

      if ( this.isConnected ) {
        setTimeout( callback, 100 );
      } else {
        return;
      }
    }.bind(this);

    setTimeout( callback, 100 );
  });

  this.ipc.on('disconnectDevice', (event, arg) => {
    console.log("Disconnected");

    this.isConnected = false;

    // 別ファイルが生成されてしまうので，少ししてから更新
    setTimeout(function () {
      this.fileManager.updateLogFileName();
      this.clock = 0;
    }.bind(this), 1000);

    event.sender.send('disconnectDeviceComplete', {
      title: "Disconnected",
      body: "This connection's data was saved in " + arg + "."
    });
  });
};

fakeConnector.prototype.setListPairedDevices = function () {
  this.model.data.app.deviceMap = [ { name: "name", address: "aaa-bbb-ccc" } ];
};

fakeConnector.prototype.closeBt = function () {};

function asyncFunc() {
  var ev = new EventEmitter;
  setTimeout(function () {
    ev.emit('done');
  }, 5000);
  return ev;
};


module.exports = fakeConnector;
