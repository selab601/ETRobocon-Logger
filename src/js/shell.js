/**
 * シェルモジュール
 * 以下の役割を持つ
 * - 各種機能コンテナのレンダリングと管理
 * - アプリケーションの状態の管理
 * - 機能モジュールの管理
 */

const FileInputForm      = require('./fileInputForm.js');
const FileReader         = require('./fileReader.js');
const DeviceConnector    = require('./deviceConnector.js');
const DeviceDisconnector = require('./deviceDisconnector.js');
const LogRenderer        = require('./logRenderer.js');

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
          </ul>
        </div>
        <div class="body"></div>
       */}).toString().replace(/(\n)/g, '').split('*')[1]
  };
  // 動的プロパティ
  this.stateMap = {
    $container : undefined,
    // 現在描画中の header-element の id
    rendered_page_id : undefined
  };
  // 機能モジュール
  this.moduleMap = {
    fileInputForm      : new FileInputForm(),
    fileReader         : new FileReader(),
    deviceConnector    : new DeviceConnector(),
    deviceDisconnector : new DeviceDisconnector(),
    logRenderer        : new LogRenderer()
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

  this.moduleMap.deviceConnector.remove();
  this.moduleMap.fileInputForm.remove();

  this.moduleMap.logRenderer.initModule(
    this.jqueryMap.$body,
    undefined
  );
  this.moduleMap.deviceDisconnector.init(
    this.jqueryMap.$body,
    logFileName,
    this.onDisconnectDevice.bind(this)
  );

  this.disableTransition();
};

shell.prototype.onDisconnectDevice = function () {
  this.moduleMap.deviceDisconnector.remove();
  this.moduleMap.logRenderer.removeModule();

  this.moduleMap.deviceConnector.init(
    this.jqueryMap.$body,
    this.onConnectDevice.bind(this)
  );
  this.moduleMap.fileInputForm.init(
    this.jqueryMap.$body.find(".device-connector-body")
  );

  this.enableTransition();
};

shell.prototype.onTransitionTo = function ( event ) {
  switch ( event.data ) {
  case "load-page":
    this.moduleMap.deviceConnector.remove();
    this.moduleMap.fileInputForm.remove();

    this.moduleMap.logRenderer.initModule(
      this.jqueryMap.$body,
      this.moduleMap.fileReader.getLogFileData.bind(this.moduleMap.fileReader)
    );
    this.moduleMap.fileReader.initModule(
      this.jqueryMap.$container.find(".log-renderer-value-list-header")
    );
    break;
  case "connect-page":
    this.moduleMap.logRenderer.removeModule();
    this.moduleMap.fileReader.removeModule();

    this.moduleMap.deviceConnector.init(
      this.jqueryMap.$body,
      this.onConnectDevice.bind(this)
    );
    this.moduleMap.fileInputForm.init(
      this.jqueryMap.$body.find(".device-connector-body")
    );
    break;
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

// TODO: private
shell.prototype.setJqueryMap = function () {
  var $container = this.stateMap.$container;
  this.jqueryMap = {
    $container    : $container,
    $contents     : $container.find(".contents"),
    $body         : $container.find(".body"),
    $connect_page : $container.find("#connect-page"),
    $load_page    : $container.find("#load-page")
  };
};

shell.prototype.initModule = function ( $container ) {
  this.stateMap.$container = $container;
  $container.html( this.configMap.main_html );
  this.setJqueryMap();
  this.transitionTo( "connect-page" );

  // 機能モジュールの初期化
  this.moduleMap.deviceConnector.init(
    this.jqueryMap.$body,
    this.onConnectDevice.bind(this)
  );
  this.moduleMap.fileInputForm.init(
    this.jqueryMap.$body.find(".device-connector-body")
  );

  // イベントハンドラ登録
  this.jqueryMap.$connect_page.bind( 'click', "connect-page", this.onTransitionTo.bind(this) );
  this.jqueryMap.$load_page.bind( 'click', "load-page", this.onTransitionTo.bind(this) );
};

module.exports = shell;
