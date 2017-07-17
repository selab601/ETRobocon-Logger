// ファイル選択のためのモジュール
const remote = require('electron').remote;
const app = remote.require('electron').app;
const Dialog = remote.dialog;

function SettingConnect () {
  // 静的プロパティ
  this.configMap = {
    main_html : (function () {
      /*
        <div id="settings-connect">
          <div class="settings-title">Connect</div>
          <div class="settings-form">
            <div class="settings-form-title">Log path :</div>
            <input type="text" class="settings-text-form settings-connect-default-path-input"/>
            <div class="settings-text-form-button settings-connect-default-path-button">
              <img src="resources/search_icon.png">
            </div>
          </div>
        </div>
      */}).toString().replace(/(\n)/g, '').split('*')[1]
  };
  // 動的プロパティ
  this.stateMap = {
    $append_target : undefined
  };
  // jQuery オブジェクトのキャッシュ用
  this.jqueryMap = {};
  // main プロセスとの通信用モジュール
  this.ipc = require('electron').ipcRenderer;
};


/******** イベントハンドラ ********/

SettingConnect.prototype.onFindDefaultPath = function ( event ) {
  Dialog.showOpenDialog(null, {
    properties: ['openDirectory'],
    title: 'ログファイル出力先の選択',
    defaultPath: app.getAppPath() + "/log"
  }, function(directories){
    // DOM に描画
    this.jqueryMap.$default_path_input.val( directories[0] );
    // main プロセス側に送信
    this.ipc.send('updateState', { doc: 'setting', key: 'default_log_directory_path', value: directories[0] });
  }.bind(this));
};

/**********************************/


SettingConnect.prototype.load = function ( default_log_directory_path ) {
  if ( default_log_directory_path != '' ) {
    this.jqueryMap.$default_path_input.val( default_log_directory_path );
  }
};


/**
 * jQuery オブジェクトをキャッシュする
 *
 * この機能モジュール内で使用する jQuery オブジェクトをキャッシュしておく
 * これを行うことで，目的の DOM を取得するためにいちいち id や class で検索する
 * 手間が省ける上に，パフォーマンスが向上する．
 */
SettingConnect.prototype.setJqueryMap = function () {
  var $append_target = this.stateMap.$append_target;
  this.jqueryMap = {
    $append_target      : $append_target,
    $default_path_input : $append_target.find(".settings-connect-default-path-input"),
    $default_path_btn   : $append_target.find(".settings-connect-default-path-button")
  };
};

/**
 * 機能モジュールの初期化
 */
SettingConnect.prototype.init = function ( $append_target ) {
  // この機能モジュールの DOM 要素をターゲットに追加
  this.stateMap.$append_target = $append_target;
  $append_target.append( this.configMap.main_html );
  // jQuery オブジェクトをキャッシュ
  this.setJqueryMap();

  // イベントハンドラの登録
  this.jqueryMap.$default_path_btn.bind( "click", this.onFindDefaultPath.bind(this) );
};

/**
 * 機能モジュールの削除
 *
 * 追加した DOM 要素を削除し，動的プロパティを初期化する
 */
SettingConnect.prototype.remove = function () {
  // DOM 要素の削除
  if ( Object.keys(this.jqueryMap).length != 0 ) {
    this.stateMap.$append_target.find("#settings-connect").remove();
    this.jqueryMap = {};
  }

  // 動的プロパティの初期化
  this.stateMap = {
    $append_target : undefined
  };
};

module.exports = SettingConnect;
