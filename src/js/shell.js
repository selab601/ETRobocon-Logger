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
const Settings           = require('./settings/settings.js');

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
    $container : undefined
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
  // main プロセスとの通信用
  this.ipc = require('electron').ipcRenderer;
  // ユーザへのメッセージ描画用のイベントハンドラ
  this.onNotify = undefined;
};

/***** イベントハンドラ *****/

/**
 * Bluetooth デバイスとの接続時の処理
 */
shell.prototype.onConnectDevice = function () {
  this.onTransitionTo( { data : "logging-page" } );
  this.jqueryMap.$header_elements.addClass("disabled");
};

/**
 * Bluetooth デバイスとの接続終了時の処理
 */
shell.prototype.onDisconnectDevice = function () {
  this.onTransitionTo( { data : "connect-page" } );
  this.jqueryMap.$header_elements.removeClass("disabled");
};

/**
 * ページの遷移を行う
 *
 * 一度全ての機能モジュールを削除し，ページの ID に応じた機能モジュールのみをロードし直す
 */
shell.prototype.onTransitionTo = function ( event ) {
  // 一度全ての機能モジュールを削除
  this.removeAllModules();

  // 機能モジュール初期化
  switch ( event.data ) {
  case "load-page":
    this.moduleMap.logAnalyzer.init(this.jqueryMap.$body);
    break;
  case "connect-page":
    this.moduleMap.deviceConnector.init( this.jqueryMap.$body, this.onConnectDevice.bind(this), this.onNotify );
    this.moduleMap.fileInputForm.init( this.jqueryMap.$body.find("#device-connector-body-footer") );
    break;
  case "settings-page":
    this.moduleMap.settings.init( this.jqueryMap.$body, this.onNotify );
    break;
  case "logging-page":
    this.moduleMap.logRenderer.init( this.jqueryMap.$body );
    this.moduleMap.deviceDisconnector.init( this.jqueryMap.$body, this.onDisconnectDevice.bind(this), this.onNotify );
    break;
  };

  // DOM 要素更新
  // 描画中のヘッダーリンクは押下できないようにする
  if ( this.jqueryMap.$rendered_page != undefined ) {
    this.jqueryMap.$rendered_page.removeClass("isRendering");
  }
  this.jqueryMap.$rendered_page = this.stateMap.$container.find("#"+event.data);
  this.jqueryMap.$rendered_page.addClass("isRendering");
};

/****************************/

/**
 * 全機能モジュールを削除する
 */
shell.prototype.removeAllModules = function () {
  Object.keys(this.moduleMap).forEach ( function ( key ) {
    // dialog モジュールは削除しない
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
    $container       : $container,
    $contents        : $container.find(".contents"),
    $header_elements : $container.find(".header-element"),
    $body            : $container.find(".body"),
    $connect_page    : $container.find("#connect-page"),
    $load_page       : $container.find("#load-page"),
    $settings_page   : $container.find("#settings-page")
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

  // 機能モジュールの初期化
  this.moduleMap.dialog.init( this.jqueryMap.$container );
  // ユーザへの通知用のイベントハンドラとして，dialog モジュール内のメソッドを保持しておく
  // 他の機能モジュールに通知用イベントハンドラとして渡す
  this.onNotify = this.moduleMap.dialog.onShowDialog.bind(this.moduleMap.dialog);

  // ページ初期化
  // WARNING: モジュールの初期化に dialog モジュールのイベントハンドラを使用しているため，
  //          dialog モジュール初期化後に実行すること
  this.onTransitionTo( { data : "connect-page" } );

  // イベントハンドラ登録
  this.jqueryMap.$connect_page.bind( 'click', "connect-page", this.onTransitionTo.bind(this) );
  this.jqueryMap.$load_page.bind( 'click', "load-page", this.onTransitionTo.bind(this) );
  this.jqueryMap.$settings_page.bind( 'click', "settings-page", this.onTransitionTo.bind(this) );
};

module.exports = shell;
