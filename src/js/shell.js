/**
 * シェルモジュール
 * 以下の役割を持つ
 * - 各種機能コンテナのレンダリングと管理
 * - アプリケーションの状態の管理
 * - 機能モジュールの管理
 */

const FileInputForm      = require('./fileInputForm.js');
const DeviceConnector    = require('./deviceConnector.js');
const DeviceDisconnector = require('./deviceDisconnector.js');
const LogRenderer        = require('./logRenderer.js');
const LogAnalyzer        = require('./logAnalyzer.js');
const Dialog             = require('./dialog.js');
const Settings           = require('./settings.js');

function shell() {
  // 静的プロパティ
  this.configMap = {
    main_html : (function () {
      /*
        <div class="title-bar">ET Robocon Logger</div>
        <div class="header">
          <ul>
            <li class="header-element" id="connect-page">Connect</li>
            <li class="header-element" id="load-page">Load</li>
            <li class="header-element" id="settings-page">Settings</li>
          </ul>
        </div>
        <div class="body"></div>
       */}).toString().replace(/(\n)/g, '').split('*')[1]
  };
  // 動的プロパティ
  this.stateMap = {
    $container : undefined,
    // 現在描画中の header-element の id
    rendered_page_id : undefined,
    logfile_name : undefined,
    logfile_folder : undefined,
    deviceMap : [],
    settings : {}
  };
  // 機能モジュール
  this.moduleMap = {
    fileInputForm      : new FileInputForm(),
    deviceConnector    : new DeviceConnector(),
    deviceDisconnector : new DeviceDisconnector(),
    logRenderer        : new LogRenderer(),
    logAnalyzer        : new LogAnalyzer(),
    dialog             : new Dialog(),
    settings           : new Settings()
  };
  // jQuery オブジェクトのキャッシュ
  this.jqueryMap = {};
};

/***** イベントハンドラ *****/

/**
 * Bluetooth デバイスとの接続時の処理
 */
shell.prototype.onConnectDevice = function () {
  // プロパティに情報を保持
  this.stateMap.logfile_name   = this.moduleMap.fileInputForm.getLogFileName();
  this.stateMap.logfile_folder = this.moduleMap.fileInputForm.getLogFileFolder();
  this.stateMap.deviceMap      = this.moduleMap.deviceConnector.getDeviceMap();

  this.onTransitionTo( { data : "logging-page" } );
  // ヘッダーのリンクを無効化
  this.jqueryMap.$container.find(".header-element").addClass("disabled");
};

/**
 * Bluetooth デバイスとの接続終了時の処理
 */
shell.prototype.onDisconnectDevice = function () {
  this.onTransitionTo( { data : "connect-page" } );
  // ヘッダーのリンクを有効化
  this.jqueryMap.$container.find(".header-element").removeClass("disabled");
};

/**
 * ページの遷移を行う
 *
 * 一度全ての機能モジュールを削除し，ページの ID に応じた機能モジュールのみをロードし直す
 */
shell.prototype.onTransitionTo = function ( event ) {
  // TODO: ページ遷移時にデータを引き継ぐのは頭悪い．モデルを切り離して管理したい
  // 設定ページにいた場合は，設定を保存する
  if ( this.stateMap.rendered_page_id === "settings-page" ) {
    this.stateMap.settings = {
      map : this.moduleMap.settings.getMapState()
    };
  }
  // 接続ページにいた場合は，設定を保存する
  if ( this.stateMap.rendered_page_id === "connect-page" ) {
    this.stateMap.logfile_name   = this.moduleMap.fileInputForm.getLogFileName();
    this.stateMap.logfile_folder = this.moduleMap.fileInputForm.getLogFileFolder();
    this.stateMap.deviceMap      = this.moduleMap.deviceConnector.getDeviceMap();
  }

  // 一度全ての機能モジュールを削除
  this.removeAllModules();

  // 機能モジュール初期化
  switch ( event.data ) {
  case "load-page":
    this.moduleMap.logAnalyzer.init(this.jqueryMap.$body);
    break;
  case "connect-page":
    this.moduleMap.deviceConnector.init(
      this.jqueryMap.$body,
      this.stateMap.deviceMap,
      this.onConnectDevice.bind(this),
      this.moduleMap.dialog.onShowDialog.bind(this.moduleMap.dialog)
    );
    this.moduleMap.fileInputForm.init(
      this.jqueryMap.$body.find("#device-connector-body-footer"),
      {
        log_file_name : this.stateMap.logfile_name,
        log_file_directory : this.stateMap.logfile_folder
      }
    );
    break;
  case "settings-page":
    this.moduleMap.settings.init(this.jqueryMap.$body, this.stateMap.settings);
    break;
  case "logging-page":
    this.moduleMap.logRenderer.init(this.jqueryMap.$body, this.stateMap.settings.map);
    this.moduleMap.deviceDisconnector.init(
      this.jqueryMap.$body,
      this.stateMap.logfile_name,
      this.onDisconnectDevice.bind(this),
      this.moduleMap.dialog.onShowDialog.bind(this.moduleMap.dialog)
    );
    break;
  };

  // プロパティに描画中のページを保持
  this.stateMap.rendered_page_id = event.data;

  // DOM 要素更新
  var page_link = this.stateMap.$container.find("#"+event.data);
  if ( page_link === undefined ) { return; }
  this.jqueryMap.$container.find(".isRendering").removeClass("isRendering");
  page_link.addClass("isRendering");
};

/****************************/

/**
 * 全機能モジュールを削除する
 */
shell.prototype.removeAllModules = function () {
  Object.keys(this.moduleMap).forEach ( function ( key ) {
    // ダイアログは削除しない
    if ( key === "dialog" ) { return; }
    this[key].remove();
  }, this.moduleMap);
};

/**
 * jQuery オブジェクトをキャッシュする
 *
 * この機能モジュール内で使用する jQuery オブジェクトをキャッシュしておく
 * これを行うことで，目的の DOM を取得するためにいちいち id や class で検索する
 * 手間が省ける上に，パフォーマンスが向上する．
 */
shell.prototype.setJqueryMap = function () {
  var $container = this.stateMap.$container;
  this.jqueryMap = {
    $container    : $container,
    $contents     : $container.find(".contents"),
    $body         : $container.find(".body"),
    $connect_page : $container.find("#connect-page"),
    $load_page    : $container.find("#load-page"),
    $settings_page: $container.find("#settings-page")
  };
};

/**
 * シェルの初期化
 */
shell.prototype.initModule = function ( $container ) {
  // DOM 要素の追加
  this.stateMap.$container = $container;
  $container.html( this.configMap.main_html );
  // jQuery オブジェクトのキャッシュ
  this.setJqueryMap();

  // ページ初期化
  this.onTransitionTo( { data : "connect-page" } );
  // 機能モジュールの初期化
  this.moduleMap.dialog.init( this.jqueryMap.$container );

  // イベントハンドラ登録
  this.jqueryMap.$connect_page.bind( 'click', "connect-page", this.onTransitionTo.bind(this) );
  this.jqueryMap.$load_page.bind( 'click', "load-page", this.onTransitionTo.bind(this) );
  this.jqueryMap.$settings_page.bind( 'click', "settings-page", this.onTransitionTo.bind(this) );
};

module.exports = shell;
