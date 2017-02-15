/**
 * ログファイルの管理を行う
 */

function fileInputForm() {
  this.configMap = {
    main_html: (function () {
      /*
        <div id="file-input-form">
          <div class="file-input-form-title">
            Log file
          </div>
          <input type="text" id="file-input-form-input"/>
        </div>
      */}).toString().replace(/(\n)/g, '').split('*')[1]
  };
  this.stateMap = {
    logFilePath: undefined,
    logFileName: undefined,
    $append_target: undefined
  };
  this.callback = undefined;
  this.ipc = require('electron').ipcRenderer;
};

/***** イベントハンドラ *****/

fileInputForm.prototype.onUpdateLogFileName = function ( event ) {
  this.stateMap.logFileName = event.target.value;
};

fileInputForm.prototype.onInitLogFileName = function ( ev, message ) {
  this.stateMap.logFileName = message;
  this.jqueryMap.$file_manager_input.val(message);
};

/****************************/

fileInputForm.prototype.getLogFileData = function () {
  var fs = require('fs'),
      // TODO: ディレクトリパスを可変にする
      logFilePath = this.stateMap.logFilePath+this.stateMap.logFileName;
  var values = new Array();

  var contents = fs.readFileSync(logFilePath);
  var lines = contents
        .toString()
        .split('\n');

  for (var i=0; i<lines.length; i++) {
    values.push(lines[i]);
  }

  // 最後に余分な改行があるので削除
  values.pop();

  return values;
};

fileInputForm.prototype.getLogFileName = function () {
  console.log(this.stateMap.logFileName);
  return this.stateMap.logFileName;
};

fileInputForm.prototype.setJqueryMap = function () {
  var $append_target = this.stateMap.$append_target;
  this.jqueryMap = {
    $append_target : $append_target,
    $file_manager_input : $append_target.parent().find("#file-input-form-input")
  };
};

fileInputForm.prototype.initModule = function ( $append_target ) {
  this.stateMap.$append_target = $append_target;
  $append_target.after( this.configMap.main_html );
  this.setJqueryMap();

  this.jqueryMap.$file_manager_input.bind( 'keyup', this.onUpdateLogFileName.bind(this) );
  this.ipc.on('initLogFileName', this.onInitLogFileName.bind(this));
};

fileInputForm.prototype.removeModule = function () {
  if ( ! this.jqueryMap === {} ) {
    this.removeHtml();
  }

  this.stateMap = {
    logFilePath: undefined,
    logFileName: undefined,
    $append_target: undefined
  };
};

fileInputForm.prototype.removeHtml = function () {
  this.jqueryMap.$append_target.find("#file-input-form").remove();
  this.jqueryMap = {};
};

module.exports = fileInputForm;
