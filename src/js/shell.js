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
            <li><a href="#" class="menu-link">RealTime Graph</a></li>
            <li><a href="#" class="menu-link">Load JSON file</a></li>
          </ul>
        </div>
        <div class="body">
        </div>
       */}).toString().replace(/(\n)/g, '').split('*')[1]
  };
  this.stateMap = {
    $container : undefined
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
  this.deviceDisconnector.initModule(
    this.jqueryMap.$body,
    this.fileManager.getLogFileName.bind(this.fileManager),
    this.onDisconnectDevice.bind(this)
  );
};

shell.prototype.onDisconnectDevice = function () {
  this.fileManager.removeModule();
  this.deviceDisconnector.removeModule();
  this.deviceConnector.initModule(
    this.jqueryMap.$body,
    this.onConnectDevice.bind(this)
  );
};

/****************************/

// TODO: private
shell.prototype.setJqueryMap = function () {
  var $container = this.stateMap.$container;
  this.jqueryMap = {
    $container : $container,
    $contents : $container.find(".contents"),
    $body : $container.find(".body")
  };
};

shell.prototype.initModule = function ( $container ) {
  this.stateMap.$container = $container;
  $container.html( this.configMap.main_html );
  this.setJqueryMap();

  // 機能モジュールの初期化
  this.deviceConnector.initModule(
    this.jqueryMap.$body,
    this.onConnectDevice.bind(this)
  );
  this.fileManager.initModule(
    this.jqueryMap.$body.find(".device-connector-body"),
    this.onConnectDevice.bind(this)
  );
};

module.exports = shell;
