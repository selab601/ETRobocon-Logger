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
