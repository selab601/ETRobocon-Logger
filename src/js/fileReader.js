const remote = require('electron').remote;
const Dialog = remote.dialog;

function fileReader() {
  this.configMap = {
    main_html: (function () {
      /*
        <div id="file-reader">
          <input type="text" id="file-reader-form-input"/>
          <div id="file-reader-select-button">SELECT</div>
        </div>
      */}).toString().replace(/(\n)/g, '').split('*')[1]
  };
  this.stateMap = {
    logFilePath: undefined,
    $append_target: undefined
  };
  this.setter = undefined;
}

fileReader.prototype.onSelectFile = function () {
  Dialog.showOpenDialog(null, {
    properties: ['openFile'],
    title: 'ファイル(単独選択)',
    defaultPath: '.',
    filters: [
      {name: 'テキストファイル', extensions: ['txt']},
      {name: 'JSONファイル', extensions: ['json']}
    ]
  }, (fileNames) => {
    this.stateMap.logFilePath = fileNames[0];
    this.jqueryMap.$form_input.val(fileNames[0]);
  });
};

fileReader.prototype.getLogFileData = function () {
  if ( this.stateMap.logFilePath === undefined ) {
    return null;
  }

  var fs = require('fs');
  var values = new Array();

  var contents = fs.readFileSync(this.stateMap.logFilePath);
  var lines = contents
        .toString()
        .split('\n');

  for (var i=0; i<lines.length; i++) {
    values.push(lines[i]);
  }

  // 最後に余分な改行があるので削除
  values.pop();

  // TODO: エラー処理
  return values;
};

fileReader.prototype.setJqueryMap = function () {
  var $append_target = this.stateMap.$append_target;
  this.jqueryMap = {
    $append_target : $append_target,
    $form_input : $append_target.parent().find("#file-reader-form-input"),
    $select_button : $append_target.parent().find("#file-reader-select-button")
  };
};

fileReader.prototype.initModule = function ( $append_target ) {
  this.stateMap.$append_target = $append_target;
  $append_target.after( this.configMap.main_html );
  this.setJqueryMap();

  this.jqueryMap.$select_button.bind( "click", this.onSelectFile.bind(this) );
};

fileReader.prototype.removeModule = function () {
  this.stateMap.$append_target.find("#file-reader").remove();

  this.stateMap = {
    logFilePath: undefined,
    logFileName: undefined,
    $append_target: undefined
  };
};

module.exports = fileReader;
