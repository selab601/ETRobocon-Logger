
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
  return data.logFileFolder + '/' + this.getLogfileName();
};

fileManager.prototype.getLogfileName = function () {
  var data = this.model.getLogSettings();
  if (data.logFileName == '') { return undefined; }
  return data.logFileName + '_' + this.model.data.setting.device_name + '.json';

}


fileManager.prototype.appendSettings = function () {
  var logFilePath = this.getLogfilePath();
  if ( logFilePath === undefined ) { return; }

  var settings = this.model.getSettings();
  if ( settings != undefined ) {
    // ヘッダーを書き込む
    this.file.appendFileSync( logFilePath, JSON.stringify(settings) + "\n", 'utf8' );
  }
  // ヘッダーの終わりだとわかる記号 (End Of Header)
  this.file.appendFileSync( logFilePath, "EOH\n", 'utf8' );
};

fileManager.prototype.appendData = function ( data ) {
  var logFilePath = this.getLogfilePath();
  if ( logFilePath === undefined ) { return; }
  this.file.appendFileSync( logFilePath, data, 'utf8' );
};

fileManager.prototype.updateLogFileName = function () {
  var data      = this.model.getLogSettings();
  var date      = new Date();
  var formatted = date.toFormat("YYYY_MMDD_HH24MISS");

  // アプリケーションのパスで出力先ディレクトリを初期化する
  if (data.logFileFolder == '') {
      logFileFolder = this.appPath + '/log';
      if (!this.file.existsSync(logFileFolder)) {
          console.log(logFileFolder + "doesn't exist");
          this.file.mkdirSync(logFileFolder);
      }

  }

  var default_path = this.model.data.setting.default_log_directory_path;
  if ( default_path != '' ) {
    logFileFolder = default_path;
  }

  this.model.data.app.logFileName = formatted;
  this.model.data.app.logFileFolder = logFileFolder;
  console.log("fileManager.updateLogFileName, fileName: " + this.getLogfileName());
};

module.exports = fileManager;
