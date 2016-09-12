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

View.prototype.addBluetoothDevicesToList = function (infos) {
  for (var i=0; i<infos.length; i++) {
    this.addBluetoothDeviceToList(infos[i]);
  }
};

View.prototype.addBluetoothDeviceToList = function (info) {
  this.dialog.hide();
  $("#bt-device-group").append(
    $('<li>').append(
      $("<a/>")
        .attr("href", "#")
        .attr("onclick", "main.io.connect(\""+info.address+"\");")
        .text(info.name)));
}

View.prototype.addBluetoothDeviceCallback = function (arg) {
  arg[0].hide();
  var $ = arg[1];
  var info = arg[2];
  for (var i=0; i<info.length; i++) {
  $("#bt-device-group").append(
    $('<li>').append(
      $("<a/>")
        .attr("href", "#")
        .attr("onclick", "main.io.connect(\""+info[i].address+"\");")
        .text(info[i].name)));
  }
}

View.prototype.transitionContent = function (component, callback, args) {
  this.$('#content').load('./htmlComponent/' + component + '.html', function () {
    callback(args);
  }.bind(args));
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

View.prototype.disableMenu = function () {
  this.$("a.menu-link").each(function (i,v){
      $(this).addClass("disabled");
  });
};

View.prototype.enableMenu = function () {
  this.$("a.menu-link").each(function (i,v){
      $(this).removeClass("disabled");
  });
};

View.prototype.checkSelectedLogFileName = function () {
  return this.$('.funkyradio-primary>input[type="radio"]:checked').val();
};

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
          .append(this.$('<div>')
                  .attr("class", "funkyradio-primary")
                  .append(this.$("<input/>")
                          .attr("type", "radio")
                          .attr("name", "radio")
                          .attr("value", files[i])
                          .attr("onclick", "main.renderGraph()")
                          .attr("id", files[i]))
                  .append(this.$("<label>")
                          .attr("for", files[i])
                          .text(files[i])));
      }
    }
  }.bind(this));

  // onclick追加
  this.$(".render-value").attr("onclick", "main.renderGraph()");
};

module.exports = View;
