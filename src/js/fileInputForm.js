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
          <input type="text" id="file-input-form-text"/>
        </div>
      */}).toString().replace(/(\n)/g, '').split('*')[1]
  };
  // 動的プロパティ
  this.stateMap = {
    logFileName: undefined,
    $append_target: undefined
  };
  // main プロセスとの通信用モジュール
  this.ipc = require('electron').ipcRenderer;
};


/***** イベントハンドラ *****/

/**
 * フォーム内で文字列が編集された際に呼び出されるイベントハンドラ
 * 入力された文字列でメモリ上のファイル名を更新する
 */
fileInputForm.prototype.onUpdateLogFileName = function ( event ) {
  this.stateMap.logFileName = event.target.value;
};

/**
 * main プロセスからログファイル名を受信した際に呼び出されるイベントハンドラ
 * アプリケーション起動後やデバイスとの接続解除後，main プロセスは現在の日時
 * から適当なログファイル名を自動生成し，renderer プロセスに送信する．
 * このイベントハンドラでは，この時に受信したファイル名でフォームを初期化する．
 */
fileInputForm.prototype.onInitLogFileName = function ( ev, message ) {
  this.stateMap.logFileName = message;
  this.jqueryMap.$file_input_form_text.val(message);
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
 * この機能モジュール内で使用する jQuery オブジェクトをキャッシュしておく
 * これを行うことで，目的の DOM を取得するためにいちいち id や class で検索する
 * 手間が省ける上に，パフォーマンスが向上する．
 */
fileInputForm.prototype.setJqueryMap = function () {
  var $append_target = this.stateMap.$append_target;
  this.jqueryMap = {
    $append_target : $append_target,
    $file_input_form_text : $append_target.parent().find("#file-input-form-text")
  };
};

/**
 * 機能モジュールの初期化
 */
fileInputForm.prototype.init = function ( $append_target ) {
  // DOM 要素をターゲットに追加
  this.stateMap.$append_target = $append_target;
  $append_target.after( this.configMap.main_html );

  // jQuery オブジェクトをキャッシュ
  this.setJqueryMap();

  // イベントハンドラを登録
  this.jqueryMap.$file_input_form_text.bind( 'keyup', this.onUpdateLogFileName.bind(this) );
  this.ipc.on('initLogFileName', this.onInitLogFileName.bind(this));
};

/**
 * 機能モジュールの削除
 * 追加した DOM 要素を削除し，動的プロパティを初期化する
 * FIXME: 二重に remove を呼び出したときにエラーとなる
 */
fileInputForm.prototype.remove = function () {
  // DOM 要素削除
  this.jqueryMap.$append_target.find("#file-input-form").remove();
  this.jqueryMap = {};

  // 動的プロパティ初期化
  this.stateMap = {
    logFileName: undefined,
    $append_target: undefined
  };
};

module.exports = fileInputForm;
