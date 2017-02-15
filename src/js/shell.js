/**
 * - 機能コンテナのレンダリングと管理
 * - アプリケーションの状態の管理
 * - 機能モジュールの管理
 */

const FileManager = require('./fileManager.js');
const DeviceConnector = require('./deviceConnector.js');
const DeviceDisconnector = require('./deviceDisconnector.js');
const Graph = require('./graph.js');

function shell() {
  this.configMap = {
    main_html : (function () {
      /*
        <div class="title-bar">ET Robocon Logger</div>
        <div class="header">
          <ul>
            <li id="connect-page">Connect</li>
            <li id="load-page">Load</li>
          </ul>
        </div>
        <div class="body">
        </div>
       */}).toString().replace(/(\n)/g, '').split('*')[1]
  };
  this.stateMap = {
    $container : undefined,
    rendered_page_id : undefined
  };
  this.jqueryMap = {};

  this.fileManager = new FileManager();
  this.deviceConnector = new DeviceConnector();
  this.deviceDisconnector = new DeviceDisconnector();
  this.graph = new Graph();
};

/***** イベントハンドラ *****/

shell.prototype.onConnectDevice = function () {
  this.deviceConnector.removeModule();
  this.fileManager.removeHtml();

  this.graph.initModule(
    this.jqueryMap.$body,
    this.fileManager.getLogFileData.bind(this.fileManager)
  );
  this.deviceDisconnector.initModule(
    this.jqueryMap.$body,
    this.fileManager.getLogFileName.bind(this.fileManager),
    this.onDisconnectDevice.bind(this)
  );
};

shell.prototype.onDisconnectDevice = function () {
  this.fileManager.removeModule();
  this.deviceDisconnector.removeModule();
  this.graph.removeModule();

  this.deviceConnector.initModule(
    this.jqueryMap.$body,
    this.onConnectDevice.bind(this)
  );
  this.fileManager.initModule(
    this.jqueryMap.$body.find(".device-connector-body")
  );
};

/****************************/

shell.prototype.transitionTo = function ( page_id ) {
  var page_link = this.stateMap.$container.find("#"+page_id);
  if ( ! page_link ) { return; }

  this.stateMap.rendered_page_id = page_id;
  page_link.addClass("isRendering");
};

// TODO: private
shell.prototype.setJqueryMap = function () {
  var $container = this.stateMap.$container;
  this.jqueryMap = {
    $container : $container,
    $contents : $container.find(".contents"),
    $body : $container.find(".body"),
    $connect_page : $container.find("#connect-page"),
    $load_page : $container.find("#load-pgae")
  };
};

shell.prototype.initModule = function ( $container ) {
  this.stateMap.$container = $container;
  $container.html( this.configMap.main_html );
  this.transitionTo( "connect-page" );
  this.setJqueryMap();

  // 機能モジュールの初期化
  this.deviceConnector.initModule(
    this.jqueryMap.$body,
    this.onConnectDevice.bind(this)
  );
  this.fileManager.initModule(
    this.jqueryMap.$body.find(".device-connector-body")
  );
};

module.exports = shell;
