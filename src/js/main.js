/*
 * main.js
 */
const D3GraphRenderer = require('./D3GraphRenderer.js');
const IO = require('./IO.js');
const View = require('./View.js');

function Main(D3Object, jQueryObject, dialog) {
  this.view = new View(D3Object, jQueryObject, dialog);

  this.io = new IO(this.view, this);
  this.renderer = new D3GraphRenderer(D3Object);

  // アプリケーションの状態を保持する
  this.stateMap = {
    connected : false,
    content : "",
    renderValues : []
  };

  // コンテンツを描画する
  this.transition('realtime');

  this.io.appendReceiver('ReceiveDataFromBTDevice', (ev, message) => {
    this.stateMap.renderValues = this.view.checkRenderValues();

    var data = JSON.parse(message);

    // 値の更新
    var list = this.renderer.getReceiveValuesList();
    for (var i=0; i<list.length; i++) {
      this.renderer.update(key, data[key], data["clock"]);
    }

    // 描画
    this.renderer.renderAll(this.stateMap.renderValues, [0, 100]);
  });
};

Main.prototype.renderGraph = function () {
  var logFileName = this.view.checkSelectedLogFileName();
  if (logFileName == null) { return; }
  this.stateMap.renderValues = this.view.checkRenderValues();
  if (this.stateMap.renderValues.length == 0) { return; }

  // グラフの状態を初期化
  this.renderer.initialize();

  var values = parseLogFile(logFileName);
  for (var i=0; i<Object.keys(values).length; i++) {
    var obj = JSON.parse(values[i]);
    Object.keys(obj).forEach(function(key) {
      this.renderer.update(key, obj[key], obj["clock"]);
    }.bind(this));
  }

  this.renderer.renderAll(this.stateMap.renderValues);
}

Main.prototype.updateConnectionState = function (state) {
  this.stateMap.connected = state;
  if (state == true) {
    this.view.enableDisconnectButton();
  } else {
    this.view.disableDisconnecButton();
    this.renderer.initialize();
  }
}

Main.prototype.transition = function (component) {
  var callback = function(){};
  // 専用の view をロード
  switch (component) {
  case "loadJson":
    callback = this.view.initLoadJsonView;
  }

  // HTML コンポーネントのロード
  if (this.stateMap.content != component) {
    this.view.transitionContent(component, callback);
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

