
// ログファイルで日付を使用するためのモジュール
require('date-utils');

function fileManager ( mainWindow, appPath, model ) {
  this.file             = require('fs'),
  this.mainWindow       = mainWindow;
  this.appPath          = appPath;
  this.didFinshLoad     = false;
  this.model            = model;
};

/****************************/

fileManager.prototype.getLogfilePath = function () {
  var data = this.model.getLogSettings();
  if ( data.logFileFolder == '' || data.logFileName == '' ) { return undefined; }
  return data.logFileFolder + '/' + data.logFileName;
};

fileManager.prototype.appendSettings = function () {
  var logFilePath = this.getLogfilePath();
  if ( logFilePath === undefined ) { return; }

  var settings = this.model.getSettings();
  if ( settings != undefined ) {
    // ヘッダーを書き込む
    this.file.appendFile( logFilePath, JSON.stringify(settings) + "\n", 'utf8' );
  }
  // ヘッダーの終わりだとわかる記号 (End Of Header)
  this.file.appendFile( logFilePath, "EOH\n", 'utf8' );
};

fileManager.prototype.appendData = function ( data ) {
  var logFilePath = this.getLogfilePath();
  if ( logFilePath === undefined ) { return; }
  this.file.appendFile( logFilePath, data, 'utf8' );
};

fileManager.prototype.updateLogFileName = function () {
  var data      = this.model.getLogSettings();
  var date      = new Date();
  var formatted = date.toFormat("YYYY_MMDD_HH24MISS");

  // アプリケーションのパスで出力先ディレクトリを初期化する
  var logFileFolder = data.logFileFolder == '' ? this.appPath + '/log' : data.logFileFolder;
  var logFileName   = formatted + '.json';

  if ( this.didFinshLoad === false ) {
    this.mainWindow.webContents.on('did-finish-load', function () {
      this.mainWindow.webContents.send('initLogFilePath', {
        folder : logFileFolder,
        name   : logFileName
      });
    }.bind(this));
    this.didFinshLoad = true;
  } else {
    this.mainWindow.webContents.send('initLogFilePath', {
        folder : logFileFolder,
        name   : logFileName
    });
  }
};

module.exports = fileManager;
