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

View.prototype.transitionContent = function (component) {
  this.$('#content').load('./htmlComponent/' + component + '.html');
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

module.exports = View;
