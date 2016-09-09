/*
 * main.js
 */
const LogWriter = require('./logWriter.js');
const D3GraphRenderer = require('./D3GraphRenderer.js');
const IO = require('./IO.js');

function Main(D3Object, jQueryObject, valueKeys) {
  this.d3 = D3Object;
  this.renderValues = valueKeys;
  this.io = new IO(jQueryObject);
  this.writer = new LogWriter();
  this.renderer = new D3GraphRenderer(this.d3, this.renderValues);
};

Main.prototype.startRenderingDynamically = function() {
  // グラフとして見たい値がある場合は以下の配列に追加する
  var renderValues = ["brightness", "gyro"];

  this.io.appendReceiver('ReceiveDataFromBTDevice', (ev, message) => {
    var data = JSON.parse(message);

    // 外部ファイルにログを出力
    this.writer.append(message);

    // 値の更新
    Object.keys(this.renderer.getReceiveValues()).forEach(function(key) {
      this.renderer.update(key, data[key]);
    }.bind(this));

    // 描画
    for (var i=0; i<this.renderValues.length; i++) {
      this.renderer.renderDynamicGraph(this.renderValues[i]);
    }
  });
};

Main.prototype.sendToMasterProcess = function (event, message) {
  this.io.send(event, message);
};

module.exports = Main;
