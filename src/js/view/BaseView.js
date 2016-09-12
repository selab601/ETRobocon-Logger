/*
 * view.js
 * レンダリング関係を行うモジュール
 */
function BaseView (D3Object, jQueryObject, dialog) {
  this.d3 = D3Object;
  this.$ = jQueryObject;
  this.dialog = dialog;
}

BaseView.prototype.showModal = function (info) {
  this.dialog.hide();
  this.$("#ModalLabel").text(info.title);
  this.$("#ModalBody").text(info.body);
  this.$('#myModal').modal('show');
};

BaseView.prototype.showDialog = function (msg) {
  this.dialog.show(msg);
};

BaseView.prototype.addBluetoothDevicesToList = function (infos) {
  for (var i=0; i<infos.length; i++) {
    this.addBluetoothDeviceToList(infos[i]);
  }
};

BaseView.prototype.addBluetoothDeviceToList = function (info) {
  this.dialog.hide();
  this.$("#bt-device-group").append(
    this.$('<li>').append(
      this.$("<a/>")
        .attr("href", "#")
        .attr("onclick", "main.io.connect(\""+info.address+"\");")
        .text(info.name)));
};

BaseView.prototype.checkRenderValues = function () {
  var renderValues = [];

  this.$('.funkyradio-success>input[type="checkbox"]').each( function(i, item) {
    if ($(this).prop('checked')) {
      renderValues.push($(this).attr("id"));
    }
  });

  return renderValues;
};

BaseView.prototype.disableMenu = function () {
  this.$("a.menu-link").each(function (i,v){
      $(this).addClass("disabled");
  });
};

BaseView.prototype.enableMenu = function () {
  this.$("a.menu-link").each(function (i,v){
      $(this).removeClass("disabled");
  });
};

module.exports = BaseView;
