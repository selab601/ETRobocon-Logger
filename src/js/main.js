/*
 * main.js
 */
const D3GraphRenderer = require('./D3GraphRenderer.js');
const IO = require('./IO.js');

function Main(D3Object, jQueryObject, dialog) {
  this.d3 = D3Object;
  this.$ = jQueryObject;
  this.renderValues = [];
  this.io = new IO(jQueryObject, dialog);
  this.renderer = new D3GraphRenderer(this.d3, this.renderValues);
};

Main.prototype.startRenderingDynamically = function() {
  this.io.appendReceiver('ReceiveDataFromBTDevice', (ev, message) => {
    this.renderValues = checkRenderValues(this.$);
    console.log(this.renderValues);

    var data = JSON.parse(message);

    // 値の更新
    Object.keys(this.renderer.getReceiveValues()).forEach(function(key) {
      this.renderer.update(key, data[key]);
    }.bind(this));

    // 描画
    this.renderer.replacementSVGElement(this.renderValues);
    for (var i=0; i<this.renderValues.length; i++) {
      this.renderer.renderDynamicGraph(this.renderValues[i]);
    }
  });
};

Main.prototype.sendToMasterProcess = function (event, message, dialogMsg) {
  this.io.send(event, message, dialogMsg);
};

var checkRenderValues = function ($) {
  var renderValues = [];
  $('.funkyradio-success>input[type="checkbox"]').each( function(i, item) {
    if ($(this).prop('checked')) {
      console.log('checked');
      renderValues.push($(this).attr("id"));
    }
  });
  console.log(renderValues);
  return renderValues;
};

module.exports = Main;
