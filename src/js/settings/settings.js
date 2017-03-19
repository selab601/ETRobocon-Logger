const SettingMap = require("./settingMap.js");
const SettingInfo = require("./settingInfo.js");
const SettingConnect = require("./settingConnect.js");

function Settings () {
  // 静的プロパティ
  this.configMap = {
    main_html : (function () {
      /*
        <div id="settings-wrapper">
          <div id="settings"></div>
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
  // 設定用機能モジュール
  this.settingMap = new SettingMap();
  this.settingInfo = new SettingInfo();
  this.settingConnect = new SettingConnect();
};

/**
 * 既存の設定情報で設定画面を初期化する
 */
Settings.prototype.load = function () {
  var image_path          = this.ipc.sendSync('getState', { doc: 'setting', key: 'image_path' });
  var image_scale         = this.ipc.sendSync('getState', { doc: 'setting', key: 'image_scale' });
  var image_original_size = this.ipc.sendSync('getState', { doc: 'setting', key: 'image_original_size' });
  var start_point         = this.ipc.sendSync('getState', { doc: 'setting', key: 'start_point' });
  var draw_scale          = this.ipc.sendSync('getState', { doc: 'setting', key: 'draw_scale' });
  var draw_rotate         = this.ipc.sendSync('getState', { doc: 'setting', key: 'draw_rotate' });
  var defualt_log_directory_path = this.ipc.sendSync('getState', { doc: 'setting', key: 'default_log_directory_path' });
  var save_setting        = this.ipc.sendSync('getState', { doc: 'app', key: 'save_setting' });

  this.settingMap.load( image_path, image_scale, image_original_size, start_point, draw_scale, draw_rotate );
  this.settingInfo.load( save_setting ) ;
  this.settingConnect.load( defualt_log_directory_path );
};

/**
 * jQuery オブジェクトをキャッシュする
 *
 * この機能モジュール内で使用する jQuery オブジェクトをキャッシュしておく
 * これを行うことで，目的の DOM を取得するためにいちいち id や class で検索する
 * 手間が省ける上に，パフォーマンスが向上する．
 */
Settings.prototype.setJqueryMap = function () {
  var $append_target = this.stateMap.$append_target;
  this.jqueryMap = {
    $append_target : $append_target
  };
};

/**
 * 機能モジュールの初期化
 */
Settings.prototype.init = function ( $append_target, onNotify ) {
  // この機能モジュールの DOM 要素をターゲットに追加
  this.stateMap.$append_target = $append_target;
  $append_target.append( this.configMap.main_html );
  // 機能モジュール初期化
  this.settingInfo.init( $append_target.find("#settings"), onNotify );
  this.settingConnect.init( $append_target.find("#settings"), onNotify );
  this.settingMap.init( $append_target.find("#settings"), onNotify );
  // jQuery オブジェクトをキャッシュ
  this.setJqueryMap();

  this.onNotify = onNotify;

  // 設定情報から設定画面を以前の設定が行われた状態に初期化する
  this.load();
};

/**
 * 機能モジュールの削除
 *
 * 追加した DOM 要素を削除し，動的プロパティを初期化する
 */
Settings.prototype.remove = function () {
  // DOM 要素の削除
  if ( Object.keys(this.jqueryMap).length != 0 ) {
    this.stateMap.$append_target.find("#settings-wrapper").remove();
    this.jqueryMap = {};
  }

  // 動的プロパティの初期化
  this.stateMap = {
    $append_target : undefined,
    draw_scale     : undefined,
    rotate_value   : undefined
  };
};

module.exports = Settings;
