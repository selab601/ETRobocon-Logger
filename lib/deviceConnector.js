/**
 * main プロセス側のデバイス接続モジュール
 */

const // main プロセス側の IPC 用モジュール
      ipcMain = require('electron').ipcMain,
      // Bluetooth デバイスの検索&通信を行うためのモジュール
      EventEmitter = require('events').EventEmitter;

function deviceConnector ( mainWindow, fileManager, model ) {
  this.didFinishLoaded = false;
  this.mainWindow = mainWindow;
  this.fileManager = fileManager;
  this.model = model;

  this.btSerial = new (require('bluetooth-serial-port')).BluetoothSerialPort(),
  this.ipc = require('electron').ipcMain;

  this.setEventHandlers();
}

deviceConnector.prototype.setEventHandlers = function () {
  this.ipc.on('updateDevices', (event, arg) => {
    console.log("Starting find devices...");
    var devices = [];

    this.btSerial.on('found', function(address, name) {
      console.log(name);
      devices.push({ name: name, address: address });
    }.bind(this));

    // Bluetooth デバイスの同期検索
    this.btSerial.inquireSync();

    // Bluetooth デバイスの情報を renderer プロセスに送信
    for ( var i = 0; i < devices.length; i++ ) {
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
  });

  this.ipc.on('connectDevice', (event, arg) => {
    console.log("Connecting...");
    var address = arg;
    this.btSerial.findSerialPortChannel(address, function(channel) {
      this.btSerial.connect(address, channel, function() {
        console.log('connected');

        event.sender.send('connectDeviceComplete', {
          title: "Cnnected!",
          body: "Successfully connected!!"
        });

        // 設定をログファイルのヘッダに書き込む
        this.fileManager.appendSettings();

        // データをデバイスから受信するたびに，renderer プロセスにデータを送信し，
        // ログファイルにデータを保存する
        this.btSerial.on('data', function(buffer) {
          this.mainWindow.webContents.send('receiveDataFromDevice', buffer);
          this.fileManager.appendData( buffer );
        }.bind(this));

      }.bind(this), function () {
        event.sender.send('connectDeviceFailed', {
          title: "Cannot Connect",
          body: "Selected device was found, but failed to connect. Please try again"
        });
        console.log('cannot connect');
      });

    }.bind(this), function() {
      event.sender.send('connectDeviceFailed', {
        title: "Found nothing",
        body: "Selected device was not found"
      });
      console.log('found nothing');
    }.bind(this));
  });

  this.ipc.on('disconnectDevice', (event, arg) => {
    console.log("Disconnected");
    this.btSerial.close();
    this.btSerial = new (require('bluetooth-serial-port')).BluetoothSerialPort();

    // 別ファイルが生成されてしまうので，少ししてからログファイル名を更新する
    setTimeout(function () {
      this.fileManager.updateLogFileName();
    }.bind(this), 1000);

    event.sender.send('disconnectDeviceComplete', {
      title: "Disconnected",
      body: "This connection's data was saved in " + arg + "."
    });
  });
};

deviceConnector.prototype.setListPairedDevices = function () {
  this.btSerial.listPairedDevices(function(pairedDevices) {
    var devices = [];
    pairedDevices.forEach(function(device) {
      devices.push( {"address": device.address, "name": device.name} );
    });
    console.log(devices);
    this.model.data.app.deviceMap = devices;
  }.bind(this));
};

deviceConnector.prototype.closeBt = function () {
  this.btSerial.close();
};

function asyncFunc() {
  var ev = new EventEmitter;
  setTimeout(function () {
    ev.emit('done');
  }, 5000);
  return ev;
};

module.exports = deviceConnector;
