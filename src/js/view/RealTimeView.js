/*
 * RealTimeView.js
 */
function RealTimeView (model, jQueryObject, dialog) {
  this.model = model;
  this.$ = jQueryObject;
  this.dialog = dialog;

  this.model.setRenderValueKinds([]);
  this.model.setShownContent("realtime");

  this.$('div.content-sidebar').load('./js/view/component/realtime-sidebar.html', function () {
    this.dialog.hide();
    this.updateBluetoothDeviceList(this.model.getConnectedDevices());
    this.updateLogFileName();
    this.$("input.render-value").attr('onclick', "main.updateRenderValueKinds()");
    this.disableDisconnecButton();
  }.bind(this));

  this.$('div.content-center').load('./js/view/component/realtime-center.html');
};

RealTimeView.prototype.updateBluetoothDeviceList = function () {
  var devices = this.model.getConnectedDevices();
  for (var i=0; i<devices.length; i++) {
    this.$("#bt-device-group").append(
      this.$('<li>').append(
        this.$("<a/>")
          .attr("href", "#")
          .attr("onclick", "main.io.connect(\"" + devices[i].address + "\");")
          .text(devices[i].name)));
  }
};

RealTimeView.prototype.updateLogFileName = function () {
  var name = this.model.getLogFileName();
  this.$("#logFileName").val(name);
};

RealTimeView.prototype.getLogFileName = function () {
  return this.$("#logFileName").val();
};

RealTimeView.prototype.enableDisconnectButton = function () {
  this.$("#disconnect-btn").removeClass("disabled");
};

RealTimeView.prototype.disableDisconnecButton = function () {
  this.$("#disconnect-btn").addClass("disabled");
};

module.exports = RealTimeView;
