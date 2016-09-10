/*
 * view.js
 * レンダリング関係を行うモジュール
 */
function View(D3Object, jQueryObject, dialog) {
  this.d3 = D3Object;
  this.$ = jQueryObject;
  this.dialog = dialog;
}

View.prototype.showModal = function (info) {
  this.dialog.hide();
  $("#ModalLabel").text(info.title);
  $("#ModalBody").text(info.body);
  $('#myModal').modal('show');
};

View.prototype.showDialog = function (msg) {
  this.dialog.show(msg);
}

View.prototype.addBluetoothDeviceToList = function (info) {
  this.dialog.hide();
  $("#bt-device-group").append(
    $('<li>').append(
      $("<a/>")
        .attr("href", "#")
        .attr("onclick", "main.io.connect(\""+info.address+"\");")
        .text(info.name)));
}

View.prototype.transitionContent = function (component, callback) {
  this.$('#content').load('./htmlComponent/' + component + '.html', function () {
    callback();
  });
}

// real time

View.prototype.enableDisconnectButton = function () {
  this.$("#disconnect-btn").prop('disabled', false);
}

View.prototype.disableDisconnecButton = function () {
  this.$("#disconnect-btn").prop('disabled', true);
}

View.prototype.checkRenderValues = function () {
  var renderValues = [];

  $('.funkyradio-success>input[type="checkbox"]').each( function(i, item) {
    if ($(this).prop('checked')) {
      renderValues.push($(this).attr("id"));
    }
  });

  return renderValues;
}

View.prototype.initLoadJsonView = function () {
  // ログファイル群の初期化
  var remote = require('remote');
  var fs = require('fs');
  var path = require('path');
  fs.readdir(remote.require('app').getAppPath()+'/log/', function(err, files) {
    if (err) {
      throw err;
    }

    for (var i=0; i<files.length; i++) {
      if (path.extname(files[i]) === ".json") {
        this.$("#log-file-group")
          .append(this.$('<li>')
                  .append(this.$("<a/>")
                          .attr("href", "#")
                          .attr("onclick", "main.renderGraph(\""+files[i]+"\")")
                          .text(files[i])));
      }
    }
  }.bind(this));
}


module.exports = View;
