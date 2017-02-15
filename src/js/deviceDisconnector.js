function deviceDisconnector () {
  this.configMap = {
    main_html : (function () {
      /*
        <div class="device-disconnector-button" id="disconnect-btn">DISCONNECT</div>
      */}).toString().replace(/(\n)/g, '').split('*')[1]
  };
  this.stateMap = {
    $append_target : undefined,
    logFileName : undefined
  };
  this.jqueryMap = {};
  this.callback = undefined;

  this.ipc = require('electron').ipcRenderer;
  this.$ = require('./lib/jquery-3.1.0.min.js');
};


/***** イベントハンドラ *****/

deviceDisconnector.prototype.onDisconnectDevice = function () {
  this.ipc.send('disconnectDevice', this.stateMap.logFileName);
  this.jqueryMap.$disconnect_btn.addClass('disabled');
};

deviceDisconnector.prototype.onDisconnectDeviceComplete = function ( ev, message ) {
  console.log(message);
  this.stateMap.isConnected = false;
  this.callback();
};

/****************************/


deviceDisconnector.prototype.setJqueryMap = function () {
  var $append_target = this.stateMap.$append_target;
  this.jqueryMap = {
    $append_target: $append_target,
    $disconnect_btn : $append_target.find("#disconnect-btn")
  };
};

deviceDisconnector.prototype.initModule = function ( $append_target, logFileName, callback ) {
  this.stateMap.$append_target = $append_target;
  $append_target.append( this.configMap.main_html );
  this.setJqueryMap();

  this.stateMap.logFileName = logFileName;
  this.callback = callback;

  // イベントハンドラの登録
  this.jqueryMap.$disconnect_btn.bind( 'click', this.onDisconnectDevice.bind(this));
  this.ipc.on('disconnectDeviceComplete', this.onDisconnectDeviceComplete.bind(this));
};

deviceDisconnector.prototype.removeModule = function () {
  this.jqueryMap.$disconnect_btn.remove();
  this.jqueryMap = {};
  this.stateMap = {
    $append_target : undefined,
    logFileName : undefined
  };
  this.jqueryMap = {};
  this.callback = undefined;
};

module.exports = deviceDisconnector;
