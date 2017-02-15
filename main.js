'use strict';

      // app: ブラウザウインドを生成するためのモジュール
      // BrowserWindow: アプリケーションのライフサイクル管理のためのモジュール
const {app, BrowserWindow} = require('electron'),
      path = require('path'),
      url = require('url'),
      is_fake = true,
      deviceConnector = is_fake ? require("./lib/fakeConnector.js") : require("./lib/deviceConnector.js"),
      FileManager = require('./lib/fileManager.js');

// メインウインドウをグローバル変数として保持しておく
// これがないと，JSのGCにウインドウを殺されてしまう
var mainWindow, dc, fileManager;

/******** アプリケーションのイベントハンドラ登録 ********/

// 起準備動時の処理
app.on('ready', function () {
  createWindow();
});

// 終了時の処理
app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') {
    app.quit();
    dc.closeBt();
  }
});

// 起動時の処理
app.on('activate', function() {
  if (mainWindow === null) {
    createWindow();
  }
});

/****** アプリケーションのイベントハンドラ登録終了 ******/


/******* 各種関数定義 *******/
// メインウインドウの生成
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 600,
    titleBarStyle: 'hidden'
  });
  mainWindow.loadURL(`file://${__dirname}/src/index.html`);

  fileManager = new FileManager( mainWindow, app.getAppPath() );
  fileManager.updateLogFilePath();

  dc = new deviceConnector( mainWindow, fileManager );

  // ウインドウが閉じられた場合の処理
  mainWindow.on('closed', function() {
    mainWindow = null;
  });

  // TODO: 以前接続したことのあるBTデバイスをどこかに保存しておく

  dc.sendListPairedDevices();
};

/***** 各種関数定義終了 *****/
