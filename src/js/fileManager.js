/**
 * ログファイルの管理を行う
 */

function fileManager() {
  this.configMap = {
    main_html: (function () {
      /*
        <div id="file-manager">
          <div class="file-manager-header">
            Log file name
          </div>
          <div class="file-manager-body">
            <input type="text" id="file-manager-input" name="file-manager-input" size="30">
          </div>
        </div>
      */}).toString().replace(/(\n)/g, '').split('*')[1]
  };
  this.stateMap = {
    logFilePath: undefined,
    logFileName: undefined,
    $append_target: undefined
  };
  this.ipc = require('electron').ipcRenderer;
};

/***** イベントハンドラ *****/

fileManager.prototype.onUpdateLogFileName = function ( event ) {
  this.stateMap.logFileName = event.target.value;
};

fileManager.prototype.onInitLogFileName = function ( ev, message ) {
  this.stateMap.logFileName = message;
  this.jqueryMap.$file_manager_input.val(message);
};

/****************************/

fileManager.prototype.getLogFileData = function () {
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

fileManager.prototype.getLogFileName = function () {
  console.log(this.stateMap.logFileName);
  return this.stateMap.logFileName;
};

fileManager.prototype.setJqueryMap = function () {
  var $append_target = this.stateMap.$append_target;
  this.jqueryMap = {
    $append_target : $append_target,
    $file_manager_input : $append_target.find("#file-manager-input")
  };
};

fileManager.prototype.initModule = function ( $append_target ) {
  this.stateMap.$append_target = $append_target;
  $append_target.append( this.configMap.main_html );
  this.setJqueryMap();

  this.jqueryMap.$file_manager_input.bind( 'keyup', this.onUpdateLogFileName.bind(this) );

  this.ipc.on('initLogFileName', this.onInitLogFileName.bind(this));
};

module.exports = fileManager;
