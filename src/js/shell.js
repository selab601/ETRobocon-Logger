/**
 * - 機能コンテナのレンダリングと管理
 * - アプリケーションの状態の管理
 * - 機能モジュールの管理
 */

const FileManager = require('./fileManager.js');
const DeviceConnector = require('./deviceConnector.js');
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
          <div class="sidebar"></div>
          <div class="contents"></div>
        </div>
       */}).toString().replace(/(\n)/g, '').split('*')[1]
  };
  this.stateMap = {
    $container : undefined
  };
  this.jqueryMap = {};

  this.fileManager = new FileManager();
  this.deviceConnector = new DeviceConnector( this.fileManager );
  this.graph = new Graph();
};

// TODO: private
shell.prototype.setJqueryMap = function () {
  var $container = this.stateMap.$container;
  this.jqueryMap = {
    $container : $container,
    $sidebar : $container.find(".sidebar"),
    $contents : $container.find(".contents")
  };
};

shell.prototype.initModule = function ( $container ) {
  this.stateMap.$container = $container;
  $container.html( this.configMap.main_html );
  this.setJqueryMap();

  // 機能モジュールの初期化
  this.fileManager.initModule( this.jqueryMap.$sidebar );
  this.deviceConnector.initModule(
    this.jqueryMap.$sidebar,
    this.fileManager.getLogFileName.bind(this.fileManager)
  );
  this.graph.initModule(
    this.jqueryMap.$sidebar,
    this.jqueryMap.$contents,
    this.fileManager.getLogFileData.bind(this.fileManager)
  );
};

module.exports = shell;
