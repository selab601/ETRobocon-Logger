function deviceDisconnector () {
  this.configMap = {
    main_html : (function () {
      /*
        <div class="device-connector-button danger" id="disconnect-btn">DISCONNECT</div>
      */}).toString().replace(/(\n)/g, '').split('*')[1]
  };
  this.stateMap = {
    $append_target : undefined
  };
  this.jqueryMap = {};
  this.getLogFileName = undefined;

  this.ipc = require('electron').ipcRenderer;
  this.$ = require('./model/lib/jquery-3.1.0.min.js');
};


/***** イベントハンドラ *****/

deviceDisconnector.prototype.onDisconnectDevice = function () {
  this.ipc.send('disconnectDevice', this.getLogFileName());
  this.jqueryMap.$disconnect_btn.addClass('disabled');
};

deviceDisconnector.prototype.onDisconnectDeviceComplete = function ( ev, message ) {
  console.log(message);
  this.stateMap.isConnected = false;
  this.jqueryMap.$disconnect_btn.removeClass('disabled');
};

/****************************/


deviceDisconnector.prototype.setJqueryMap = function () {
  var $append_target = this.stateMap.$append_target;
  this.jqueryMap = {
    $append_target: $append_target,
    $disconnect_btn : $append_target.find("#disconnect-btn")
  };
};

deviceDisconnector.prototype.initModule = function ( $append_target ) {
  this.stateMap.$append_target = $append_target;
  $append_target.append( this.configMap.main_html );
  this.setJqueryMap();

  this.getLogFileName = getLogFileName;

  // イベントハンドラの登録
  this.jqueryMap.$disconnect_btn.bind( 'click', this.onDisconnectDevice.bind(this));
  this.ipc.on('disconnectDeviceComplete', this.onDisconnectDeviceComplete.bind(this));
};

module.exports = deviceDisconnector;
