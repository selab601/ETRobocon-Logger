/**
 * ログファイルの管理を行う
 */

function fileManager() {
  this.configMap = {
    main_html: (function () {
      /*
        <div id="log-file-name">
          <div class="sidebar-header">
          Log file name
          </div>

          <div class="sidebar-content">
            <center>
              <input type="text" id="logFileName" name="logFileName" size="30">
            </center>
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
  this.jqueryMap.$logFileName.val(message);
};

/****************************/

fileManager.prototype.getLogFileData = function () {
  var fs = require('fs'),
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
    $logFileName : $append_target.find("#logFileName")
  };
};

fileManager.prototype.initModule = function ( $append_target ) {
  this.stateMap.$append_target = $append_target;
  $append_target.append( this.configMap.main_html );
  this.setJqueryMap();

  this.jqueryMap.$logFileName.bind( 'keyup', this.onUpdateLogFileName.bind(this) );

  this.ipc.on('initLogFileName', this.onInitLogFileName.bind(this));
};

module.exports = fileManager;
