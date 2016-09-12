/*
 * main.js
 */
const D3GraphRenderer = require('./D3GraphRenderer.js');
const IO = require('./IO.js');
const View = require('./View.js');
const ApplicationModel = require('./ApplicationModel.js');

function Main(D3Object, jQueryObject, dialog) {
  this.$ = jQueryObject;
  this.dialog = dialog;
  this.view = new View(D3Object, jQueryObject, dialog);
  this.model = new ApplicationModel();

  this.io = new IO(this.view, this);
  this.renderer = new D3GraphRenderer(D3Object);

  // 画面遷移
  this.transition('realtime');

  this.io.appendReceiver('ReceiveDataFromBTDevice', (ev, message) => {
    var data = JSON.parse(message);

    // 値の更新
    var kinds = this.renderer.getReceiveValuesList();
    for (var i=0; i<kinds.length; i++) {
      this.renderer.update(kinds[i], data["clock"], data[kinds[i]]);
    }

    // 描画
    this.renderer.renderAll(
      this.view.checkRenderValues(),
      [data["clock"]-1000*10, data["clock"]]
    );
  });
};

Main.prototype.updateRenderValueKinds = function () {
  this.model.setRenderValueKinds(this.view.checkRenderValues());
};

Main.prototype.renderGraph = function () {
  var logFileName = this.view.checkSelectedLogFileName();
  console.log(logFileName);
  if (logFileName == null) { return; }

  // グラフの状態を初期化
  this.renderer.initialize();

  var values = parseLogFile(logFileName);
  for (var i=0; i<Object.keys(values).length; i++) {
    var obj = JSON.parse(values[i]);
    Object.keys(obj).forEach(function(key) {
      this.renderer.update(key, obj["clock"], obj[key]);
    }.bind(this));
  }

  this.renderer.renderAll(this.model.getRenderValues());
  this.renderer.addBrush(this.model.getRenderValues());
};

Main.prototype.updateConnectionState = function (connected) {
  this.model.updateConnectionState(connected);
  if (connected) {
    this.view.enableDisconnectButton();
    this.view.disableMenu();
  } else {
    this.view.disableDisconnecButton();
    this.renderer.initialize();
    this.view.enableMenu();
  }
};

Main.prototype.addDevices = function (devices) {
  this.model.addConnectedDevices(devices);
  if (this.model.getShownContent() == 'realtime') {
      this.transition('realtime');
  }
};

Main.prototype.transition = function (component) {
  var callback = function(){};
  var args;
  // 専用の view をロード
  switch (component) {
  case "realtime":
    if (this.model.getConnectedDevices().length > 0) {
      callback = this.view.initRealTimeGraphView;
      args = [this.dialog, this.$, this.model.getConnectedDevices()];
    }
    break;
  case "loadJson":
    callback = this.view.initLoadJsonView;
    break;
  }

  // HTML コンポーネントのロード
  this.model.setRenderValueKinds([]);
  this.model.setShownContent(component);
  this.view.transitionContent(component, callback, args);
};

Main.prototype.io = function () {
  return this.io;
}();

var parseLogFile = function (logFileName) {
  var remote = require('remote'),
      fs = require('fs'),
      logFilePath = remote.require('app').getAppPath()+'/log/'+logFileName;
  var values = new Array();

  var contents = fs.readFileSync(logFilePath);
  var lines = contents
        .toString()
        .split('\n');

  for (var i=0; i<lines.length; i++) {
    values.push(lines[i]);
  }

  // 最後に余分な改行があるので削除
  values.pop();

  return values;
};

module.exports = Main;

