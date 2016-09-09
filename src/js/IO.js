/*
 * IO.js
 * MainProcess, RendererProcess 間の通信関係の関数定義
 */
function IO ($) {
  this.ipc = require('electron').ipcRenderer;

  // 受信
  this.ipc.on('BTDevice', (ev, message) => {
    $("#bt-device-group")
      .append($('<li>')
              .append($("<a/>").attr("href", "#")
                      .attr("onclick", "main.sendToMasterProcess('connectBTDevice', \""+message.address+"\")")
                      .text(message.name)));
  });

  this.ipc.on('ModalMessage', (ev, message) => {
    $("#ModalLabel").text(message.title);
    $("#ModalBody").text(message.body);
    $('#myModal').modal('show');
  });
}

// 送信
IO.prototype.send = function (event, message) {
  this.ipc.send(event, message);
};

IO.prototype.appendReceiver = function (event, func) {
  this.ipc.on(event, (ev,msg) => func(ev, msg));
};

module.exports = IO;
