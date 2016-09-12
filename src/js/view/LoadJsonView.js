/*
 * LoadJsonView.js
 */
function LoadJsonView (model, jQueryObject, dialog) {
  this.model = model;
  this.$ = jQueryObject;
  this.dialog = dialog;

  this.model.setRenderValueKinds([]);
  this.model.setShownContent("loadJson");

  // サイドバー描画
  this.$('div#content-sidebar').load('./js/view/component/loadJson-sidebar.html', function () {
    // ログファイル群の初期化
    var remote = require('remote');
    var fs = require('fs');
    var path = require('path');
    fs.readdir(remote.require('app').getAppPath()+'/log/', function(err, files) {
      if (err) {
        throw err;
      }

      for (var i=files.length-1; i>=0; i--) {
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
    this.$("input.render-value").attr("onclick", "main.updateRenderValueKinds();main.renderGraph();");
  }.bind(this));

  // センターコンテンツ描画
  this.$('div#content-center').load('./js/view/component/loadJson-center.html');
};

LoadJsonView.prototype.checkSelectedLogFileName = function () {
  return this.$('.funkyradio-primary>input[type="radio"]:checked').val();
};

module.exports = LoadJsonView;
