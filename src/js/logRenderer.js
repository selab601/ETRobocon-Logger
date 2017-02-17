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

function logRenderer() {
  // 静的なプロパティ
  this.configMap = {
    main_html : (function () {
      /*
        <div id="log-renderer">
          <div id="log-renderer-list-box">
            <div class="log-renderer-list-header">
              Render Graph
            </div>
            <div class="log-renderer-list"></div>
          </div>

          <nav id="log-renderer-tabs">
            <div id="log-renderer-tab-graph" class="log-renderer-tab selected">Graph</div>
            <div id="log-renderer-tab-table" class="log-renderer-tab">Table</div>
          </nav>
          <div id="log-renderer-content-graph" class="log-renderer-content selected"></div>
          <div id="log-renderer-content-table" class="log-renderer-content"></div>
        </div>
      */}).toString().replace(/(\n)/g, '').split('*')[1],
    graph_value_base_html : (function () {
      /*
        <div class="log-renderer-list-val">
          <input type="checkbox" name="checkbox" />
          <label></label>
        </div>
      */}).toString().replace(/(\n)/g, '').split('*')[1],
    graph_value_map : require('./config/logged_values.js').values
  };
  // 動的なプロパティ
  this.stateMap = {
    $append_target : undefined,
    render_value_keymap: []
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
  this.graphRenderer = new D3GraphRenderer( keymap, this.stateMap.render_value_keymap, 100, "log-renderer-content-graph" );
  this.tableRenderer = new TableRenderer( keymap, this.stateMap.render_value_keymap );
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

  // グラフの描画
  this.graphRenderer.renderAll(null, null, ["label", "focus"]);
};

/**
 * 描画対象の値の種類一覧において種類の選択/非選択が切り替わった際に呼び出されるイベントハンドラ
 *
 * 選択状況をプロパティに保持する．
 * また，ログファイルからのデータ読み込み用コールバックが登録されている場合には，
 * ログファイルからデータを読み込みグラフを描画する．
 */
logRenderer.prototype.onUpdateRenderValue = function ( event ) {
  // 選択された値の種類をプロパティに保存する
  var index = this.stateMap.render_value_keymap.indexOf( event.data );
  if ( index >= 0 ) {
    this.stateMap.render_value_keymap.splice(index,1);
    this.graphRenderer.remove( event.data );
  } else {
    this.stateMap.render_value_keymap.push( event.data );
  }
};

/**
 * タブ選択時に呼び出されるコールバック関数
 *
 * 選択されたタブに応じて描画を切り替える．
 */
logRenderer.prototype.onSelectTab = function ( event ) {
  // 既に選択済みのタブ等から選択を外す
  // TODO: 選択したタブ等は dom を参照するのではなくメモリ上に保存すべき
  this.jqueryMap.$append_target.find(".selected").removeClass("selected");

  switch ( event.target.id ) {
  case "log-renderer-tab-table":
    this.jqueryMap.$tab_table.addClass("selected");
    this.jqueryMap.$content_table.addClass("selected");
    break;
  case "log-renderer-tab-graph":
    this.jqueryMap.$tab_graph.addClass("selected");
    this.jqueryMap.$content_graph.addClass("selected");
    break;
  }
};

/*********************/


/**
 * レンダリングするログ内の値のリストをビューに描画する
 *
 * ログには多数の種類の値が保持されており，その種類は本モジュールの configMap
 * 内に保持されている．
 * 負荷対策のため，グラフの描画時にはそれらの中からどの種類の値についてグラフ
 * を描画するか選択し，選択されたグラフのみを描画する．
 * この選択を行うために，ログファイル内の値の種類の一覧を描画する必要がある．
 */
logRenderer.prototype.initGraphValuesList = function () {
  this.configMap.graph_value_map.forEach( function ( value ) {
    var base_html = this.$( this.configMap.graph_value_base_html );
    base_html.find( 'input' )
      .attr( 'id', value.id )
      .bind( 'click', value.id, this.onUpdateRenderValue.bind(this) );
    base_html.find( 'label' )
      .attr( 'for', value.id )
      .text( value.label );
    this.jqueryMap.$list.append( base_html );
  }.bind(this));
};

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
    $tab           : $append_target.find(".log-renderer-tab"),
    $tab_graph     : $append_target.find("#log-renderer-tab-graph"),
    $tab_table     : $append_target.find("#log-renderer-tab-table"),
    $content_graph : $append_target.find("#log-renderer-content-graph"),
    $content_table : $append_target.find("#log-renderer-content-table")
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

  // 描画する値の種類一覧をビューに描画する
  this.initGraphValuesList();

  // レンダリングモジュールの初期化
  this.tableRenderer.initModule( this.jqueryMap.$content_table );

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
    $append_target      : undefined,
    render_value_keymap : []
  };

  // レンダリングモジュールの初期化
  var keymap = [];
  this.configMap.graph_value_map.forEach( function ( data ) {
    keymap.push(data.id);
  }.bind(this));
  this.graphRenderer = null;
  this.graphRenderer = new D3GraphRenderer( keymap, this.stateMap.render_value_keymap, 100, "log-renderer-content-graph" );
  this.tableRenderer = null;
  this.tableRenderer = new TableRenderer( keymap, this.stateMap.render_value_keymap );
};

module.exports = logRenderer;
