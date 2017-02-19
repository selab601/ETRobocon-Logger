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
    deviceMap : []
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
  var logFileName = this.moduleMap.fileInputForm.getLogFileName();

  // デバイス情報の保持
  // TODO: 外部ファイルに保持しておくべき？
  this.stateMap.deviceMap = this.moduleMap.deviceConnector.getDeviceMap();

  // モジュール削除
  this.removeAllModules();
  // モジュール初期化
  this.moduleMap.logRenderer.init(this.jqueryMap.$body);
  this.moduleMap.deviceDisconnector.init(
    this.jqueryMap.$body,
    logFileName,
    this.onDisconnectDevice.bind(this),
    this.moduleMap.dialog.onShowDialog.bind(this.moduleMap.dialog)
  );

  this.disableTransition();
};

shell.prototype.onDisconnectDevice = function () {
  // モジュール削除
  this.removeAllModules();
  // モジュール初期化
  this.moduleMap.deviceConnector.init(
    this.jqueryMap.$body,
    this.stateMap.deviceMap,
    this.onConnectDevice.bind(this),
    this.moduleMap.dialog.onShowDialog.bind(this.moduleMap.dialog)
  );
  this.moduleMap.fileInputForm.init(
    this.jqueryMap.$body.find("#device-connector-body-footer")
  );

  this.enableTransition();
};

shell.prototype.onTransitionTo = function ( event ) {
  switch ( event.data ) {
  case "load-page":
    // モジュール削除
    this.removeAllModules();
    // モジュール初期化
    this.moduleMap.logAnalyzer.init(this.jqueryMap.$body);
    break;
  case "connect-page":
    // モジュール削除
    this.removeAllModules();
    // モジュール初期化
    this.moduleMap.deviceConnector.init(
      this.jqueryMap.$body,
      this.stateMap.deviceMap,
      this.onConnectDevice.bind(this),
      this.moduleMap.dialog.onShowDialog.bind(this.moduleMap.dialog)
    );
    this.moduleMap.fileInputForm.init(
      this.jqueryMap.$body.find("#device-connector-body-footer")
    );
    break;
  case "settings-page":
    // モジュール削除
    this.removeAllModules();
    // モジュール初期化
    this.moduleMap.settings.init(this.jqueryMap.$body);
  };

  this.transitionTo( event.data );
};

/****************************/

shell.prototype.enableTransition = function () {
  this.jqueryMap.$container.find(".header-element").removeClass("disabled");
};

shell.prototype.disableTransition = function () {
  this.jqueryMap.$container.find(".header-element").addClass("disabled");
};

shell.prototype.transitionTo = function ( page_id ) {
  var page_link = this.stateMap.$container.find("#"+page_id);
  if ( ! page_link ) { return; }

  this.jqueryMap.$container.find(".isRendering").removeClass("isRendering");
  this.stateMap.rendered_page_id = page_id;
  page_link.addClass("isRendering");
};

shell.prototype.removeAllModules = function () {
  Object.keys(this.moduleMap).forEach ( function ( key ) {
    // ダイアログは削除しない
    if ( key === "dialog" ) { return; }
    this[key].remove();
  }, this.moduleMap);
};

// TODO: private
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

shell.prototype.initModule = function ( $container ) {
  // DOM 要素の追加
  this.stateMap.$container = $container;
  $container.html( this.configMap.main_html );
  // jQuery オブジェクトのキャッシュ
  this.setJqueryMap();

  this.transitionTo( "connect-page" );

  // 機能モジュールの初期化
  this.moduleMap.deviceConnector.init(
    this.jqueryMap.$body,
    this.stateMap.deviceMap,
    this.onConnectDevice.bind(this),
    this.moduleMap.dialog.onShowDialog.bind(this.moduleMap.dialog)
  );
  this.moduleMap.fileInputForm.init(
    this.jqueryMap.$body.find("#device-connector-body-footer")
  );
  this.moduleMap.dialog.init( this.jqueryMap.$container );

  // イベントハンドラ登録
  this.jqueryMap.$connect_page.bind( 'click', "connect-page", this.onTransitionTo.bind(this) );
  this.jqueryMap.$load_page.bind( 'click', "load-page", this.onTransitionTo.bind(this) );
  this.jqueryMap.$settings_page.bind( 'click', "settings-page", this.onTransitionTo.bind(this) );
};

module.exports = shell;
