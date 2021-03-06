/**
 * ログデータのレンダリングモジュール
 *
 * ログデータは，現状以下の種類の形式で出力できる
 *  - グラフ   : ログファイルの読み込みの場合は，全データを1つのグラフに描画する
 *               デバイスとの接続時には，描画範囲(時間幅)を指定してリアルタイムに値を描画する
 *  - テーブル : ログファイルの読み込みの場合は，何も描画しない
 *               デバイスとの接続時には，各種値の現在値をテーブルに描画し続ける
 */

// グラフ描画用のモジュール
const D3GraphRenderer = require('./renderer/D3GraphRenderer.js');
// テーブル描画用のモジュール
const TableRenderer = require('./renderer/TableRenderer.js');
// マップ描画用のモジュール
const MapRenderer = require('./renderer/MapRenderer.js');

function logRenderer() {
  // 静的なプロパティ
  this.configMap = {
    main_html : (function () {
      /*
        <div id="log-renderer">
          <nav class="tabs">
            <div id="log-renderer-tab-graph" class="tab selected">
              <div class="tab-header"></div>
              <div class="tab-body">Graph</div>
            </div>
            <div id="log-renderer-tab-table" class="tab">
              <div class="tab-header"></div>
              <div class="tab-body">Table</div>
            </div>
            <div id="log-renderer-tab-map" class="tab">
              <div class="tab-header"></div>
              <div class="tab-body">Map</div>
            </div>
          </nav>
          <div id="log-renderer-content-graph" class="tab-content selected"></div>
          <div id="log-renderer-content-table" class="tab-content"></div>
          <div id="log-renderer-content-map" class="tab-content"></div>
        </div>
      */}).toString().replace(/(\n)/g, '').split('*')[1],
    graph_value_map : require('./config/logged_values.js').values
  };
  // 動的なプロパティ
  this.stateMap = {
    $append_target : undefined
  };
  // jQuery オブジェクトキャッシュ用
  this.jqueryMap = {};
  // main プロセスとの通信用モジュール
  this.ipc = require('electron').ipcRenderer;
  // jQuery
  this.$ = require('./lib/jquery-3.1.0.min.js');

  // 他のレンダリング用モジュールの初期化
  var keymap = [];
  this.configMap.graph_value_map.forEach( function ( data ) {
    keymap.push(data.id);
  }.bind(this));
  // TODO: 描画範囲(現状は100)を動的に指定できるようにする
  this.graphRenderer = new D3GraphRenderer( keymap, "log-renderer-content-graph");
  this.tableRenderer = new TableRenderer( keymap, this.stateMap.render_value_keymap );
  this.mapRenderer   = new MapRenderer();
};


/***** イベントハンドラ *****/

/**
 * Bluetooth デバイスからのデータを受信した際に呼び出されるイベントハンドラ
 *
 * 受信したデータで，グラフとテーブルの描画を更新する
 */
logRenderer.prototype.onReceiveDataFromDevice = function ( ev, message ) {
  // TODO: 値の検証
  var data = JSON.parse(message);

  Object.keys(data).forEach(function(key) {
    // グラフデータの更新
    // 受信データに誤りがあるとここで挿入に失敗する
    // TODO: 受信データのチェック
    this.graphRenderer.update(key, data["clock"], data[key]);

    // テーブルの更新
    this.tableRenderer.update(key, data[key]);
  }.bind(this));

  // Map の描画
  this.mapRenderer.render( data["coordinate_x"]/10, data["coordinate_y"]/10, data["clock"] );

  // グラフの描画
  this.graphRenderer.renderAll(null, null, ["label", "focus"]);
};

/**
 * タブ選択時に呼び出されるコールバック関数
 *
 * 選択されたタブに応じて描画を切り替える．
 */
logRenderer.prototype.onSelectTab = function ( event ) {
  // 既に選択済みのタブ等から選択を外す
  this.jqueryMap.$selected_tab.removeClass("selected");
  this.jqueryMap.$selected_content.removeClass("selected");

  switch ( event.currentTarget.id ) {
  case "log-renderer-tab-table":
    this.jqueryMap.$selected_tab     = this.jqueryMap.$tab_table;
    this.jqueryMap.$selected_content = this.jqueryMap.$content_table;
    break;
  case "log-renderer-tab-graph":
    this.jqueryMap.$selected_tab     = this.jqueryMap.$tab_graph;
    this.jqueryMap.$selected_content = this.jqueryMap.$content_graph;
    break;
  case "log-renderer-tab-map":
    this.jqueryMap.$selected_tab     = this.jqueryMap.$tab_map;
    this.jqueryMap.$selected_content = this.jqueryMap.$content_map;
    break;
  }

  this.jqueryMap.$selected_tab.addClass("selected");
  this.jqueryMap.$selected_content.addClass("selected");
};

/*********************/

/**
 * jQuery オブジェクトをキャッシュする
 *
 * この機能モジュール内で使用する jQuery オブジェクトをキャッシュしておく
 * これを行うことで，目的の DOM を取得するためにいちいち id や class で検索する
 * 手間が省ける上に，パフォーマンスが向上する．
 */
logRenderer.prototype.setJqueryMap = function () {
  var $append_target = this.stateMap.$append_target;
  this.jqueryMap = {
    $append_target : $append_target,
    $list          : $append_target.find(".log-renderer-list"),
    $tab           : $append_target.find(".tab"),
    $tab_graph     : $append_target.find("#log-renderer-tab-graph"),
    $tab_table     : $append_target.find("#log-renderer-tab-table"),
    $tab_map       : $append_target.find("#log-renderer-tab-map"),
    $content_graph : $append_target.find("#log-renderer-content-graph"),
    $content_table : $append_target.find("#log-renderer-content-table"),
    $content_map   : $append_target.find("#log-renderer-content-map")
  };
};

/**
 * 機能モジュールの初期化
 */
logRenderer.prototype.init = function ( $append_target ) {
  // この機能モジュールの DOM 要素をターゲットに追加
  this.stateMap.$append_target = $append_target;
  $append_target.html( this.configMap.main_html );
  // jQuery オブジェクトをキャッシュ
  this.setJqueryMap();

  // タブ選択の初期化
  this.jqueryMap.$selected_tab     = this.jqueryMap.$tab_graph;
  this.jqueryMap.$selected_content = this.jqueryMap.$content_graph;

  // レンダリングモジュールの初期化
  this.graphRenderer.init( this.jqueryMap.$content_graph, 100 );
  this.tableRenderer.initModule( this.jqueryMap.$content_table );
  this.mapRenderer.init( this.jqueryMap.$content_map, {
    image_path          : this.ipc.sendSync('getState', { doc: 'setting', key: 'image_path'}),
    image_original_size : this.ipc.sendSync('getState', { doc: 'setting', key: 'image_original_size'}),
    start_point         : this.ipc.sendSync('getState', { doc: 'setting', key: 'start_point'}),
    draw_scale          : this.ipc.sendSync('getState', { doc: 'setting', key: 'draw_scale'}),
    draw_rotate         : this.ipc.sendSync('getState', { doc: 'setting', key: 'draw_rotate'})
  }, undefined );

  // イベントハンドラを登録
  this.ipc.on('receiveDataFromDevice', this.onReceiveDataFromDevice.bind(this));
  this.jqueryMap.$tab.bind( 'click', this.onSelectTab.bind(this) );
};

/**
 * 機能モジュールの削除
 *
 * 追加した DOM 要素を削除し，動的プロパティを初期化する
 * FIXME: 二重に remove を呼び出したときにエラーとなる
 */
logRenderer.prototype.remove = function () {
  // DOM 要素削除
  if ( Object.keys(this.jqueryMap).length != 0 ) {
    this.stateMap.$append_target.find("#log-renderer").remove();
    this.jqueryMap = {};
  }

  // イベントハンドラの削除
  this.ipc.removeAllListeners('receiveDataFromDevice');

  // 動的プロパティの初期化
  this.stateMap = {
    $append_target      : undefined
  };

  // レンダリングモジュールの初期化
  var keymap = [];
  this.configMap.graph_value_map.forEach( function ( data ) {
    keymap.push(data.id);
  }.bind(this));
  this.graphRenderer = null;
  this.graphRenderer = new D3GraphRenderer( keymap, this.stateMap.render_value_keymap, 100, "log-renderer-content-graph-box" );
  this.tableRenderer = null;
  this.tableRenderer = new TableRenderer( keymap, this.stateMap.render_value_keymap );
  this.mapRenderer = null;
  this.mapRenderer = new MapRenderer();
};

module.exports = logRenderer;
