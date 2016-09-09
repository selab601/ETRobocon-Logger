/*
 * logWriter.js
 * ログを外部ファイルに出力するためのモジュール
 */
var LogWriter = (function () {
  require('date-utils');

  var LogWriter = function(){
    this.date = new Date();
    this.formatted = this.date.toFormat("YYYY_MMDD_HH24MISS");
    this.fileName = 'log/' + this.formatted + '.json';
    this.file = require('fs');
  };

  LogWriter.prototype.getFileName = function(){
    return this.fileName;
  };

  // ファイルに書き込む
  LogWriter.prototype.append = function(message){
    this.file.appendFile(this.fileName, message ,'utf8' );
  };

  return { writer : LogWriter };
}());
