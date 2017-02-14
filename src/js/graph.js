/**
 * グラフ描画機能モジュール
 */

const D3GraphRenderer = require('./model/D3GraphRenderer.js');

function graph() {
  this.configMap = {
    device_list_html : (function () {
      /*
        <div id="graph">
          <div class="graph-header">
            Render Graph
          </div>
          <div class="graph-body"></div>
        </div>
      */}).toString().replace(/(\n)/g, '').split('*')[1],
    graph_html : '<div id="d3graph"></div>',
    graph_value_base_html : (function () {
      /*
        <div class="graph-render-value">
          <input type="checkbox" name="checkbox" />
          <label></label>
        </div>
      */}).toString().replace(/(\n)/g, '').split('*')[1],
    graph_value_map : [
      { id : "gyro", label : "ジャイロセンサ値" },
      { id : "touch", label : "タッチセンサ値" },
      { id : "sonar", label : "ソナー値" },
      { id : "brightness", label : "輝度値" },
      { id : "rgb_r", label : "RGB(R値)" },
      { id : "rgb_g", label : "RGB(G値)" },
      { id : "rgb_b", label : "RGB(B値)" },
      { id : "hsv_h", label : "HSV(H値)" },
      { id : "hsv_s", label : "HSV(S値)" },
      { id : "hsv_v", label : "HSV(V値)" },
      { id : "arm_count", label : "前輪エンコーダ値" },
      { id : "left_count", label : "左輪エンコーダ値" },
      { id : "right_count", label : "右輪エンコーダ値" },
      { id : "length", label : "走行距離" },
      { id : "angle", label : "車体角度" },
      { id : "coordinate_x", label : "自己位置X座標" },
      { id : "coordinate_y", label : "自己位置Y座標" },
      { id : "clock", label : "時刻" }
    ]
  };
  this.stateMap = {
    $list_append_target : undefined,
    $graph_append_target : undefined,
    render_value_keymap: []
  };

  this.jqueryMap = {};
  this.ipc = require('electron').ipcRenderer;
  this.getLogFileData = undefined;
  this.$ = require('./model/lib/jquery-3.1.0.min.js');

  var keymap = [];
  this.configMap.graph_value_map.forEach( function ( data ) {
    keymap.push(data.id);
  }.bind(this));
  this.renderer = new D3GraphRenderer( keymap, this.stateMap.render_value_keymap, 100 );
};

/** イベントハンドラ **/

graph.prototype.onReceiveDataFromDevice = function ( ev, message ) {
  var data = JSON.parse(message);

  // 値の更新
  Object.keys(data).forEach(function(key) {
    // 受信データに誤りがあるとここで挿入に失敗する
    // TODO: 受信データのチェック
    this.renderer.update(key, data["clock"], data[key]);
  }.bind(this));

  // 描画
  // X 軸のデータ数をここで決めている
  // 描画しないデータは renderer 内で捨てるようにする
  // this.renderer.renderAll([data["clock"]-1000*10, data["clock"]]);
  this.renderer.renderAll();
  this.renderer.addLabel();
  this.renderer.addFocus();
};

graph.prototype.onUpdateRenderValue = function ( event ) {
  var index = this.stateMap.render_value_keymap.indexOf( event.data );
  if ( index >= 0 ) {
    this.stateMap.render_value_keymap.splice(index,1);
  } else {
    this.stateMap.render_value_keymap.push( event.data );
  }
};

graph.prototype.onRenderGraphFromLogFile = function ( event ) {
  var values = this.getLogFileData();
  if ( values === undefined ) {
    return;
  }

  this.renderer.initialize();

  for (var i=0; i<Object.keys(values).length; i++) {
    var obj = JSON.parse(values[i]);
    Object.keys(obj).forEach(function(key) {
      this.renderer.update(key, obj["clock"], obj[key]);
    }.bind(this));
  }

  this.renderer.renderAll();
  this.renderer.addBrush();
};

/*********************/

graph.prototype.initGraphValuesList = function () {
  this.configMap.graph_value_map.forEach( function (value) {
    var base_html = this.$(this.configMap.graph_value_base_html);
    base_html.find('input')
      .attr('id', value.id)
      .bind('click', value.id, this.onUpdateRenderValue.bind(this));
    base_html.find('label')
      .attr('for', value.id)
      .text(value.label);
    this.jqueryMap.$graph_body.append(base_html);
  }.bind(this));
};

graph.prototype.setJqueryMap = function () {
  var $graph_append_target = this.stateMap.$graph_append_target;
  var $list_append_target = this.stateMap.$list_append_target;
  this.jqueryMap = {
    $graph_append_target : $graph_append_target,
    $list_append_target : $list_append_target,
    $graph_body : $list_append_target.find(".graph-body")
  };
};

graph.prototype.initModule = function ( $list_append_target, $graph_append_target, getLogFileData ) {
  this.stateMap.$list_append_target = $list_append_target;
  this.stateMap.$graph_append_target = $graph_append_target;
  $list_append_target.append( this.configMap.device_list_html );
  $graph_append_target.html( this.configMap.graph_html );
  this.setJqueryMap();
  this.initGraphValuesList();

  this.getLogFileData = getLogFileData;

  // イベントハンドラ登録

  this.ipc.on('receiveDataFromDevice', this.onReceiveDataFromDevice.bind(this));
};

module.exports = graph;
