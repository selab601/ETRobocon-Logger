/*
 * IO.js
 * MainProcess, RendererProcess 間の通信関係の関数定義
 */
function IO ($, dialog) {
  this.ipc = require('electron').ipcRenderer;
  this.dialog = dialog;

  // 受信
  this.ipc.on('BTDevice', function (ev, message) {
    this.dialog.hide();
    $("#bt-device-group")
      .append($('<li>')
              .append($("<a/>").attr("href", "#")
                      .attr("onclick", "main.sendToMasterProcess('connectBTDevice', \""+message.address+"\", \"Connecting...\")")
                      .text(message.name)));
  }.bind(this));

  this.ipc.on('ModalMessage', function (ev, message) {
    this.dialog.hide();
    $("#ModalLabel").text(message.title);
    $("#ModalBody").text(message.body);
    $('#myModal').modal('show');
  }.bind(this));
}

// 送信
IO.prototype.send = function (event, message, dialogMsg) {
  console.log(this.dialog)
  this.dialog.show(dialogMsg);
  this.ipc.send(event, message);
};

IO.prototype.appendReceiver = function (event, func) {
  this.ipc.on(event, (ev,msg) => func(ev, msg));
};

module.exports = IO;
