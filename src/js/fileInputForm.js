/**
 * ログファイルの名前及びその保存先ディレクトリの入力用フォームを提供する
 */

// ファイル選択のためのモジュール
const remote = require('electron').remote;
const app = remote.require('electron').app;
const Dialog = remote.dialog;

function fileInputForm() {
  // 静的プロパティ
  this.configMap = {
    main_html: (function () {
      /*
        <div id="file-input-form">
          <div class="file-input-form-title">
            Log file
          </div>
          <div class="file-input-form-file-form">
            <div class="file-input-form-label">Name :</div>
            <input type="text" class="file-input-form-text file"/>
          </div>
          <div class="file-input-form-directory-form">
            <div class="file-input-form-label">Folder :</div>
            <input type="text" class="file-input-form-text directory"/>
            <div class="file-input-form-search-button">
              <img src="resources/search_icon.png">
            </div>
          </div>
        </div>
      */}).toString().replace(/(\n)/g, '').split('*')[1]
  };
  // 動的プロパティ
  this.stateMap = {
    logFileFolder  : undefined,
    logFileName    : undefined,
    $append_target : undefined
  };
  // jQuery オブジェクトのキャッシュ用
  this.jqueryMap = {};
  // main プロセスとの通信用モジュール
  this.ipc = require('electron').ipcRenderer;
};


/***** イベントハンドラ *****/

/**
 * フォーム内で文字列が編集された際に呼び出されるイベントハンドラ
 *
 * 入力された文字列でメモリ上のファイル名を更新する
 */
fileInputForm.prototype.onUpdateLogFileName = function ( event ) {
  // プロパティに保持
  this.stateMap.logFileName = event.target.value;
  // main プロセス側に送信
  this.ipc.send('updateState', { doc: 'app', key: 'logFileName', value: this.stateMap.logFileName } );
};

/**
 * ディレクトリの検索ボタンが押下されたら呼び出されるイベントハンドラ
 *
 * フォルダ選択画面を開きフォルダを選択させる．
 * 選択したフォルダでテキスト領域を更新する．
 */
fileInputForm.prototype.onSearchDirectory = function ( event ) {
  var logFilePath = this.ipc.sendSync('getState', { 'doc': 'app', 'key': 'logFileFolder' });
  if ('' == logFilePath) {
    // 設定されていなかったらデフォルトの保存先
    logFilePath = app.getAppPath() + '/log';
  }
  Dialog.showOpenDialog(null, {
    properties: ['openDirectory'],
    title: 'ログファイル出力先の選択',
    defaultPath: logFilePath
  }, function(directories){
    // プロパティに保持
    this.stateMap.logFileFolder = directories[0];
    // DOM に描画
    this.jqueryMap.$directory_form.val( directories[0] );
    // main プロセス側に送信
    this.ipc.send('updateState', { doc: 'app', key: 'logFileFolder', value: this.stateMap.logFileFolder });
  }.bind(this));
};

/****************************/

/**
 * jQuery オブジェクトをキャッシュする
 *
 * この機能モジュール内で使用する jQuery オブジェクトをキャッシュしておく
 * これを行うことで，目的の DOM を取得するためにいちいち id や class で検索する
 * 手間が省ける上に，パフォーマンスが向上する．
 */
fileInputForm.prototype.setJqueryMap = function () {
  var $append_target = this.stateMap.$append_target;
  this.jqueryMap = {
    $append_target  : $append_target,
    $input_form     : $append_target.parent().find(".file-input-form-text.file"),
    $directory_form : $append_target.parent().find(".file-input-form-text.directory"),
    $search_button  : $append_target.parent().find(".file-input-form-search-button")
  };

  // DOM 要素描画後，ログファイル名が設定されていれば初期化
  if ( this.stateMap.logFileName != undefined ) {
    this.jqueryMap.$input_form.val(this.stateMap.logFileName);
    this.jqueryMap.$directory_form.val(this.stateMap.logFileFolder);
  }
};

/**
 * 機能モジュールの初期化
 */
fileInputForm.prototype.init = function ( $append_target ) {
  // この機能モジュールの DOM 要素をターゲットに追加
  this.stateMap.$append_target = $append_target;
  $append_target.after( this.configMap.main_html );
  // jQuery オブジェクトをキャッシュ
  this.setJqueryMap();

  // ログファイルディレクトリ初期化
  var fileName = this.ipc.sendSync('getState', { doc: 'app', key: 'logFileFolder' });
  if ( fileName != '' ) {
    this.stateMap.logFileFolder = fileName;
    this.jqueryMap.$directory_form.val(fileName);
  }

  // ログファイル名初期化
  var folderName = this.ipc.sendSync('getState', { doc: 'app', key: 'logFileName' });
  if ( folderName != '' ) {
    this.stateMap.logFileName = folderName;
    this.jqueryMap.$input_form.val(folderName);
  }

  // イベントハンドラを登録
  this.jqueryMap.$input_form.bind( 'change', this.onUpdateLogFileName.bind(this) );
  this.jqueryMap.$search_button.bind( 'click', this.onSearchDirectory.bind(this) );
};

/**
 * 機能モジュールの削除
 *
 * 追加した DOM 要素を削除し，動的プロパティを初期化する
 * FIXME: 二重に remove を呼び出したときにエラーとなる
 */
fileInputForm.prototype.remove = function () {
  // DOM 要素削除
  if ( Object.keys(this.jqueryMap).length != 0 ) {
    this.jqueryMap.$append_target.find("#file-input-form").remove();
    this.jqueryMap = {};
  }

  // 動的プロパティ初期化
  this.stateMap = {
    logFileName    : undefined,
    $append_target : undefined
  };
};

module.exports = fileInputForm;
