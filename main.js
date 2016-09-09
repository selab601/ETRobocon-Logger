'use strict';

// main プロセス側の IPC 用モジュール
const ipcMain = require('electron').ipcMain;
// シリアル通信用モジュール
const SerialPort = require('serialport');
// アプリケーションのライフサイクル管理のためのモジュール
const app = require('app');
// ブラウザウインドを生成するためのモジュール
const BrowserWindow = require('browser-window');
// Bluetooth デバイスの検索&通信を行うためのモジュール
var BluetoothSerialPort = require('bluetooth-serial-port');

// メインウインドウをグローバル変数として保持しておく
// これがないと，JSのGCにウインドウを殺されてしまう
var mainWindow;

var btSerial = new BluetoothSerialPort.BluetoothSerialPort();

// 起準備動時の処理
app.on('ready', createWindow);

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

// メインウインドウの生成
function createWindow() {
  mainWindow = new BrowserWindow({width: 1024, height: 600});
  mainWindow.loadURL(`file://${__dirname}/src/index.html`);

  // ウインドウが閉じられた場合の処理
  mainWindow.on('closed', function() {
    mainWindow = null;
  });
};

var ipc = require('electron').ipcMain;
ipc.on('findBTDevice', (event, arg) => {
  console.log("Starting find devices...");

  btSerial.on('found', function(address, name) {
    console.log(name);
    console.log(address);
    mainWindow.webContents.send('BTDevice', {name: name, address: address});
    btSerial.close();
  });

  btSerial.inquire();
});

ipc.on('connectBTDevice', (event, arg) => {
  console.log("Connecting...");
  var address = arg;
  btSerial.findSerialPortChannel(address, function(channel) {
    btSerial.connect(address, channel, function() {
      console.log('connected');

      btSerial.on('data', function(buffer) {
        mainWindow.webContents.send('ReceiveDataFromBTDevice', buffer);
      });
    }, function () {
      console.log('cannot connect');
    });

  }, function() {
    console.log('found nothing');
  });
});


btSerial.listPairedDevices(function(pairedDevices) {
    pairedDevices.forEach(function(device) {
        console.log(device);
    });
});
