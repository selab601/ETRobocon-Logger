/**
 * グラフ描画機能モジュール
 */

const D3GraphRenderer = require('./model/D3GraphRenderer.js');
const TableRenderer = require('./model/TableRenderer.js');

function graph() {
  this.configMap = {
    main_html : (function () {
      /*
        <div id="graph">
          <div id="graph-value-list-box">
            <div class="graph-value-list-header">
              Render Graph
            </div>
            <div class="graph-value-list"></div>
          </div>

          <nav id="graph-nav">
            <div id="graph-nav-graph-tab" class="graph-nav-content selected">Graph</div>
            <div id="graph-nav-table-tab" class="graph-nav-content">Table</div>
          </nav>
          <div id="graph-nav-graph" class="graph-content selected"></div>
          <div id="graph-nav-table" class="graph-content"></div>
        </div>
      */}).toString().replace(/(\n)/g, '').split('*')[1],
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
    $append_target : undefined,
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
  this.tableRenderer = new TableRenderer( keymap, this.stateMap.render_value_keymap );
};

/** イベントハンドラ **/

graph.prototype.onReceiveDataFromDevice = function ( ev, message ) {
  var data = JSON.parse(message);

  /***** グラフの更新 *****/

  // 値の更新
  Object.keys(data).forEach(function(key) {
    // 受信データに誤りがあるとここで挿入に失敗する
    // TODO: 受信データのチェック
    this.renderer.update(key, data["clock"], data[key]);

    /***** 表の更新 *****/
    this.tableRenderer.update(key, data[key]);
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
    this.renderer.remove( event.data );
  } else {
    this.stateMap.render_value_keymap.push( event.data );
  }

  if ( this.getLogFileData != undefined ) {
    this.onRenderGraphFromLogFile();
  }
};

graph.prototype.onRenderGraphFromLogFile = function () {
  var values = this.getLogFileData();
  if ( values === null ) { return; }

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

graph.prototype.onSelectTab = function ( event ) {
  console.log(event.target.id);

  // TODO: 選択したタブ等は dom に保存するのではなくメモリ上に保存すべき
  this.jqueryMap.$append_target.find(".selected").removeClass("selected");

  switch ( event.target.id ) {
  case "graph-nav-table-tab":
    this.jqueryMap.$graph_nav_table_tab.addClass("selected");
    this.jqueryMap.$graph_nav_table.addClass("selected");
    break;
  case "graph-nav-graph-tab":
    this.jqueryMap.$graph_nav_graph_tab.addClass("selected");
    this.jqueryMap.$graph_nav_graph.addClass("selected");
    break;
  }
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
    this.jqueryMap.$graph_value_list.append(base_html);
  }.bind(this));
};

graph.prototype.setJqueryMap = function () {
  var $append_target = this.stateMap.$append_target;
  this.jqueryMap = {
    $append_target : $append_target,
    $graph_value_list : $append_target.find(".graph-value-list"),
    $graph_nav_contents : $append_target.find(".graph-nav-content"),
    $graph_nav_graph_tab : $append_target.find("#graph-nav-graph-tab"),
    $graph_nav_table_tab : $append_target.find("#graph-nav-table-tab"),
    $graph_nav_graph : $append_target.find("#graph-nav-graph"),
    $graph_nav_table : $append_target.find("#graph-nav-table")
  };
};

graph.prototype.initModule = function ( $append_target, getLogFileData ) {
  this.stateMap.$append_target = $append_target;
  $append_target.html( this.configMap.main_html );
  this.setJqueryMap();
  this.initGraphValuesList();

  this.tableRenderer.initModule( this.jqueryMap.$graph_nav_table );

  this.getLogFileData = getLogFileData;

  // イベントハンドラ登録

  this.ipc.on('receiveDataFromDevice', this.onReceiveDataFromDevice.bind(this));
  this.jqueryMap.$graph_nav_contents.bind( 'click', this.onSelectTab.bind(this) );
};

graph.prototype.removeModule = function () {
  this.stateMap.$append_target.find("#graph").remove();
  this.jqueryMap = {};

  this.stateMap = {
    $append_target : undefined,
    render_value_keymap: []
  };
  this.getLogFileData = undefined;

  var keymap = [];
  this.configMap.graph_value_map.forEach( function ( data ) {
    keymap.push(data.id);
  }.bind(this));
  this.renderer = null;
  this.renderer = new D3GraphRenderer( keymap, this.stateMap.render_value_keymap, 100 );
};

module.exports = graph;
