
// ログファイルで日付を使用するためのモジュール
require('date-utils');

function fileManager ( mainWindow, appPath ) {
  this.file = require('fs'),
  this.appPath = appPath;
  this.mainWindow = mainWindow;
  this.logFilePath = null;
  this.logFileName = null;
}

fileManager.prototype.appendData = function ( data ) {
  if ( this.logFilePath === null || this.logFileName === null ) { return; }
  this.file.appendFile( this.logFilePath + this.logFileName, data, 'utf8' );
};

// ログファイル名をリネーム
// TODO: 文字列が空だったりすると失敗するので，エラー処理が必要
fileManager.prototype.renameFile = function ( new_name ) {
  this.file.renameSync( this.logFilePath + this.logFileName, this.logFilePath + new_name );
};

fileManager.prototype.updateLogFilePath = function () {
  var date = new Date();
  var formatted = date.toFormat("YYYY_MMDD_HH24MISS");

  this.logFileName = formatted + '.json';
  this.logFilePath = this.appPath + '/log/';

  this.mainWindow.webContents.on('did-finish-load', function () {
    this.mainWindow.webContents.send('initLogFileName', this.logFileName);
  }.bind(this));
};

module.exports = fileManager;
