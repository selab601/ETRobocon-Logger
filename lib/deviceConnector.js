/**
 * main プロセス側のデバイス接続モジュール
 */

const // main プロセス側の IPC 用モジュール
      ipcMain = require('electron').ipcMain,
      // Bluetooth デバイスの検索&通信を行うためのモジュール
      EventEmitter = require('events').EventEmitter;

// ログファイルで日付を使用するためのモジュール
require('date-utils');

function deviceConnector ( mainWindow, appPath ) {
  this.file = require('fs'),
  this.logFilePath = null;
  this.logFileName = null;
  this.didFinishLoaded = false;
  this.appPath = appPath;
  this.mainWindow = mainWindow;

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
      console.log(address);
      devices.push({name: name, address: address});
    });

    var async = asyncFunc();
    async.on('done', function() {
      this.btSerial.close();

      event.sender.send('updateDevicesFailed', {
        title: "Finish",
        body: devices.length + " devices were found"
      });

      for (var i=0; i<devices.length; i++) {
        this.mainWindow.webContents.send('updateDevicesComplete', devices[i]);
      }
    }.bind(this));

    this.btSerial.inquire();
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

        this.btSerial.on('data', function(buffer) {
          this.mainWindow.webContents.send('receiveDataFromDevice', buffer);
          file.appendFile(this.logFilePath, buffer, 'utf8');
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
    this.btSerial = new BluetoothSerialPort.BluetoothSerialPort();

    // 受信が続いていると新しくファイルを作ってしまうので，切断後ちょっとしてからファイル名を更新する
    var async = asyncFunc();
    async.on('done', function() {
      // ログファイル名をリネーム
      var path = app.getAppPath() + '/log/';
      // TODO: 文字列が空だったりすると失敗するので，エラー処理が必要
      file.renameSync(path + this.logFileName, path + arg);
      updateLogFileName();
      event.sender.send('disconnectDeviceComplete', {
        title: "Disconnected",
        body: "This connection's data was saved in " + arg + "."
      }.bind(this));
    }.bind(this));
  });
};

deviceConnector.prototype.updateLogFileName = function () {
  var date = new Date();
  var formatted = date.toFormat("YYYY_MMDD_HH24MISS");
  this.logFileName = formatted + '.json';
  this.logFilePath = this.appPath + '/log/' + this.logFileName;

  if (this.didFinishLoaded == false) {
    this.mainWindow.webContents.on('did-finish-load', function () {
      this.didFinishLoaded = true;
      this.mainWindow.webContents.send('LogFileName', this.logFileName);
    }.bind(this));
  } else {
    this.mainWindow.webContents.send('LogFileName', this.logFileName);
  }
};

deviceConnector.prototype.sendListPairedDevices = function () {
  // 接続済みのものを renderer プロセスに教える
  this.btSerial.listPairedDevices(function(pairedDevices) {
    console.log(pairedDevices);
    pairedDevices.forEach(function(device) {
      this.mainWindow.webContents.on('did-finish-load', function () {
        this.mainWindow.webContents.send('updateDevicesComplete', {name: device.name, address: device.address});
      }.bind(this));
    }.bind(this));
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
