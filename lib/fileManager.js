
// ログファイルで日付を使用するためのモジュール
require('date-utils');

      // main プロセス側の IPC 用モジュール
const ipcMain = require('electron').ipcMain;

function fileManager ( mainWindow, appPath ) {
  this.file = require('fs'),
  this.mainWindow = mainWindow;
  // アプリケーションのパスで出力先ディレクトリを初期化する
  this.logFileDirectory = appPath + '/log';
  this.logFileName = null;
  this.didFinshLoad = false;
  // renderer プロセスとの通信用
  this.ipc = require('electron').ipcMain;
  // イベントハンドラの登録
  this.ipc.on('updateLogFileDirectory', this.onUpdateLogFileDirectory.bind(this));
  this.ipc.on('updateLogFileName', this.onUpdateLogFileName.bind(this));
};

/***** イベントハンドラ *****/

fileManager.prototype.onUpdateLogFileDirectory = function ( event, arg ) {
  this.logFileDirectory = arg;
};

fileManager.prototype.onUpdateLogFileName = function ( event, arg ) {
  this.logFileName = arg;
};

/****************************/

fileManager.prototype.getLogfilePath = function () {
  return this.logFileDirectory + '/' + this.logFileName;
};

fileManager.prototype.appendData = function ( data ) {
  if ( this.logFileDirectory === null || this.logFileName === null ) { return; }
  this.file.appendFile( this.getLogfilePath(), data, 'utf8' );
};

fileManager.prototype.updateLogFileName = function () {
  var date = new Date();
  var formatted = date.toFormat("YYYY_MMDD_HH24MISS");

  this.logFileName = formatted + '.json';

  if ( this.didFinshLoad === false ) {
    this.mainWindow.webContents.on('did-finish-load', function () {
      this.mainWindow.webContents.send('initLogFilePath', {
        folder: this.logFileDirectory,
        name : this.logFileName
      });
    }.bind(this));
    this.didFinshLoad = true;
  } else {
    this.mainWindow.webContents.send('initLogFilePath', {
        folder: this.logFileDirectory,
        name : this.logFileName
    });
  }
};

module.exports = fileManager;
