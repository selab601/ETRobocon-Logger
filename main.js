'use strict';

      // app: ブラウザウインドを生成するためのモジュール
      // BrowserWindow: アプリケーションのライフサイクル管理のためのモジュール
const {app, BrowserWindow} = require('electron'),
      path = require('path'),
      url = require('url'),
      // main プロセス側の IPC 用モジュール
      ipcMain = require('electron').ipcMain,
      // Bluetooth デバイスの検索&通信を行うためのモジュール
      btSerial = new (require('bluetooth-serial-port')).BluetoothSerialPort(),
      EventEmitter = require('events').EventEmitter;

    // メインウインドウをグローバル変数として保持しておく
    // これがないと，JSのGCにウインドウを殺されてしまう
var mainWindow,
    file = require('fs'),
    logFilePath,
    logFileName,
    didFinishLoaded = false;

// ログファイルで日付を使用するためのモジュール
require('date-utils');

/******** アプリケーションのイベントハンドラ登録 ********/

// 起準備動時の処理
app.on('ready', function () {
  createWindow();
  updateLogFileName();
});

// 終了時の処理
app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') {
    app.quit();
    btSerial.close();
  }
});

// 起動時の処理
app.on('activate', function() {
  if (mainWindow === null) {
    createWindow();
  }
});

/****** アプリケーションのイベントハンドラ登録終了 ******/


/********* プロセス間通信のイベントハンドラ登録 *********/

var ipc = require('electron').ipcMain;

ipc.on('findBTDevice', (event, arg) => {
  console.log("Starting find devices...");
  var devices = [];

  btSerial.on('found', function(address, name) {
    console.log(name);
    console.log(address);
    devices.push({name: name, address: address});
  });

  var async = asyncFunc();
  async.on('done', function() {
    btSerial.close();

    event.sender.send('finishFindingDevice', {
      title: "Finish",
      body: devices.length + " devices were found"
    });

    for (var i=0; i<devices.length; i++) {
      mainWindow.webContents.send('BTDevice', devices[i]);
    }
  });

  btSerial.inquire();
});

ipc.on('connectBTDevice', (event, arg) => {
  console.log("Connecting...");
  var address = arg;
  btSerial.findSerialPortChannel(address, function(channel) {
    btSerial.connect(address, channel, function() {
      console.log('connected');

      event.sender.send('connected', {
        title: "Cnnected!",
        body: "Successfully connected!!"
      });

      btSerial.on('data', function(buffer) {
        mainWindow.webContents.send('ReceiveDataFromBTDevice', buffer);
        file.appendFile(logFilePath, buffer, 'utf8');
      });
    }, function () {
      event.sender.send('cannotConnected', {
        title: "Cannot Connect",
        body: "Selected device was found, but failed to connect. Please try again"
      });
      console.log('cannot connect');
    });

  }, function() {
    event.sender.send('deviceNotFound', {
      title: "Found nothing",
      body: "Selected device was not found"
    });
    console.log('found nothing');
  });
});

ipc.on('disconnect', (event, arg) => {
  console.log("Disconnected");
  btSerial.close();
  btSerial = new BluetoothSerialPort.BluetoothSerialPort();

  // 受信が続いていると新しくファイルを作ってしまうので，切断後ちょっとしてからファイル名を更新する
  var async = asyncFunc();
  async.on('done', function() {
    // ログファイル名をリネーム
    var path = app.getAppPath() + '/log/';
    // TODO: 文字列が空だったりすると失敗するので，エラー処理が必要
    file.renameSync(path + logFileName, path + arg);
    updateLogFileName();
    event.sender.send('disconnected', {
      title: "Disconnected",
      body: "This connection's data was saved in " + arg + "."
    });
  });
});

/******* プロセス間通信のイベントハンドラ登録終了 *******/


/******* 各種関数定義 *******/

function asyncFunc() {
  var ev = new EventEmitter;
  setTimeout(function () {
    ev.emit('done');
  }, 5000);
  return ev;
};

// メインウインドウの生成
function createWindow() {
  mainWindow = new BrowserWindow({width: 1024, height: 600});
  mainWindow.loadURL(`file://${__dirname}/src/index.html`);

  // ウインドウが閉じられた場合の処理
  mainWindow.on('closed', function() {
    mainWindow = null;
  });

  // TODO: 以前接続したことのあるBTデバイスをどこかに保存しておく

  // 接続済みのものを renderer プロセスに教える
  btSerial.listPairedDevices(function(pairedDevices) {
    console.log(pairedDevices);
    pairedDevices.forEach(function(device) {
      mainWindow.webContents.on('did-finish-load', function () {
        mainWindow.webContents.send('BTDevice', {name: device.name, address: device.address});
      });
    });
  });
};

function updateLogFileName() {
  var date = new Date();
  var formatted = date.toFormat("YYYY_MMDD_HH24MISS");
  logFileName = formatted + '.json';
  logFilePath = app.getAppPath() + '/log/' + logFileName;

  if (didFinishLoaded == false) {
    mainWindow.webContents.on('did-finish-load', function () {
      didFinishLoaded = true;
      mainWindow.webContents.send('LogFileName', logFileName);
    });
  } else {
    mainWindow.webContents.send('LogFileName', logFileName);
  }
}

/***** 各種関数定義終了 *****/
