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
    Object.keys(this.renderer.getReceiveValues()).forEach(function(key) {
      this.renderer.update(key, data[key]);
    }.bind(this));

    // 描画
    this.renderer.replacementSVGElement(this.stateMap.renderValues);
    for (var i=0; i<this.stateMap.renderValues.length; i++) {
      this.renderer.renderDynamicGraph(this.stateMap.renderValues[i]);
    }
  });
};

Main.prototype.renderGraph = function (logFileName) {
  this.stateMap.renderValues = this.view.checkRenderValues();

  var values = this.renderer.parseLogFile(logFileName);
  for (var i=0; i<Object.keys(values).length; i++) {
    var obj = JSON.parse(values[i]);
    this.renderer.setReceiveValue(obj);
  }

  this.renderer.replacementSVGElement(this.stateMap.renderValues);
  for (var i=0; i<this.stateMap.renderValues.length; i++) {
    this.renderer.renderGraph(this.stateMap.renderValues[i]);
  }
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

module.exports = Main;

