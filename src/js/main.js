/*
 * main.js
 */
const D3GraphRenderer = require('./D3GraphRenderer.js');
const IO = require('./IO.js');
const ApplicationModel = require('./ApplicationModel.js');

const BaseView = require('./BaseView.js');
const RealTimeView = require('./RealTimeView.js');
const LoadJsonView = require('./LoadJsonView.js');

function Main(D3Object, jQueryObject, dialog) {
  this.$ = jQueryObject;
  this.dialog = dialog;
  this.model = new ApplicationModel();

  this.baseView = new BaseView(D3Object, jQueryObject, dialog);
  this.contentView = new RealTimeView(this.model, this.$, this.dialog);

  this.renderer = new D3GraphRenderer(D3Object);
  this.io = new IO(this.baseView, this, this.model);
};

Main.prototype.updateRenderValueKinds = function () {
  this.model.setRenderValueKinds(this.baseView.checkRenderValues());
};

Main.prototype.renderDynamicGraph = function (stringData) {
  var data = JSON.parse(stringData);

  // 値の更新
  var kinds = this.renderer.getReceiveValuesList();
  for (var i=0; i<kinds.length; i++) {
    this.renderer.update(kinds[i], data["clock"], data[kinds[i]]);
    this.model.appendHistory(kinds[i], data[kinds[i]]);
  }

  // 描画
  this.renderer.renderAll(
    this.baseView.checkRenderValues(),
    [data["clock"]-1000*10, data["clock"]]
  );
};

Main.prototype.renderGraph = function () {
  if (this.model.getShownContent() != "loadJson") { return; }

  var logFileName = this.contentView.checkSelectedLogFileName();
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
  // menu bar あたりに表示していたほうが良いかも
  if (this.model.getShownContent() == "realtime") {
    if (connected) {
      this.contentView.enableDisconnectButton();
      this.baseView.disableMenu();
    } else {
      this.contentView.disableDisconnecButton();
      this.renderer.initialize();
      this.baseView.enableMenu();
    }
  }
};

Main.prototype.addDevices = function (devices) {
  this.model.addConnectedDevices(devices);

  // 再描画
  if (this.model.getShownContent() == 'realtime') {
      this.contentView.updateBluetoothDeviceList();
  }
};

/*
 * 画面遷移
 */
Main.prototype.transition = function (component) {
  switch (component) {
  case "realtime":
    this.contentView = new RealTimeView(this.model, this.$, this.dialog);
    break;
  case "loadJson":
    this.contentView = new LoadJsonView(this.model, this.$, this.dialog);
    break;
  }
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

