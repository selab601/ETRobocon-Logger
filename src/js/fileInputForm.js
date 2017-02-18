/**
 * ファイル名の入力用フォームを提供する
 * TODO: 保存先となるディレクトリを変更できるようにする
 */

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
  this.stateMap.logFileName = event.target.value;
};

/**
 * main プロセスからログファイル名を受信した際に呼び出されるイベントハンドラ
 *
 * アプリケーション起動後やデバイスとの接続解除後，main プロセスは現在の日時
 * から適当なログファイル名を自動生成し，renderer プロセスに送信する．
 * このイベントハンドラでは，この時に受信したファイル名でフォームを初期化する．
 */
fileInputForm.prototype.onInitLogFileName = function ( ev, message ) {
  this.stateMap.logFileName = message;

  // DOM 要素が描画前であれば，描画しない
  // この場合，DOM 要素描画時にログファイル名が描画される．
  if ( this.jqueryMap.$input_form === undefined ) { return; }
  this.jqueryMap.$input_form.val(message);
};

/**
 * ディレクトリの検索ボタンが押下されたら呼び出されるイベントハンドラ
 *
 * フォルダ選択画面を開きフォルダを選択させる．
 * 選択したフォルダでテキスト領域を更新する．
 */
fileInputForm.prototype.onSearchDirectory = function ( event ) {
  console.log("clicked");
};

/****************************/


/**
 * ログファイル名の getter
 */
fileInputForm.prototype.getLogFileName = function () {
  return this.stateMap.logFileName;
};

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
    $append_target : $append_target,
    $input_form : $append_target.parent().find(".file-input-form-text.file"),
    $search_button : $append_target.parent().find(".file-input-form-search-button")
  };

  // DOM 要素描画後，ログファイル名が設定されていれば初期化
  if ( this.stateMap.logFileName != undefined ) {
    this.jqueryMap.$input_form.val(this.stateMap.logFileName);
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

  // イベントハンドラを登録
  this.jqueryMap.$input_form.bind( 'keyup', this.onUpdateLogFileName.bind(this) );
  this.jqueryMap.$search_button.bind( 'click', this.onSearchDirectory.bind(this) );
  this.ipc.on('initLogFileName', this.onInitLogFileName.bind(this));
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

  // イベントハンドラの削除
  this.ipc.removeAllListeners('initLogFileName');

  // 動的プロパティ初期化
  this.stateMap = {
    logFileName: undefined,
    $append_target: undefined
  };
};

module.exports = fileInputForm;
