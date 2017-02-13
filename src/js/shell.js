/**
 * - 機能コンテナのレンダリングと管理
 * - アプリケーションの状態の管理
 * - 機能モジュールの管理
 */

const DeviceConnector = require('./deviceConnector.js');
const Graph = require('./graph.js');

function shell() {
  this.configMap = {
    main_html : (function () {
      /*
    <div class="container">

      <!-- menubar -->
      <div class="container-header">
        <ul>
          <li id="title">ET2016 Logger</li>
          <li><a href="#" class="menu-link" onclick="main.transition('realtime');">RealTime Graph</a></li>
          <li><a href="#" class="menu-link" onclick="main.transition('loadJson');">Load JSON file</a></li>
        </ul>
      </div>

      <!-- content -->
      <div class="container-content">
        <!-- sidebar -->
        <div class="container-content-sidebar">
        </div>
        <!-- center -->
        <div class="container-content-center">
        </div>
      </div>

    </div>

    <!-- Modal -->
    <div class="modal fade" id="myModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h4 class="modal-title" id="ModalLabel">
              Modal title
            </h4>
          </div>
          <div class="modal-body" id="ModalBody">
            ...
          </div>
          <div class="modal-footer">
            <center>
              <button type="button" class="btn btn-primary" data-dismiss="modal">Close</button>
            </center>
          </div>
        </div>
      </div>
    </div>
       */}).toString().replace(/(\n)/g, '').split('*')[1]
  };
  this.stateMap = {
    $container : undefined
  };
  this.jqueryMap = {};

  this.deviceConnector = new DeviceConnector();
  this.graph = new Graph();
};

// TODO: private
shell.prototype.setJqueryMap = function () {
  var $container = this.stateMap.$container;
  this.jqueryMap = {
    $container : $container,
    $container_content_sidebar : $container.find(".container-content-sidebar"),
    $container_content_center : $container.find(".container-content-center")
  };
};

shell.prototype.initModule = function ( $container ) {
  this.stateMap.$container = $container;
  $container.html( this.configMap.main_html );
  this.setJqueryMap();

  // 機能モジュールの初期化
  this.deviceConnector.initModule( this.jqueryMap.$container_content_sidebar );
  this.graph.initModule(
    this.jqueryMap.$container_content_sidebar,
    this.jqueryMap.$container_content_center
  );
};

module.exports = shell;
