/**
 * ログファイルの描画モジュール
 */

// ファイル選択のためのモジュール
const remote = require('electron').remote;
const Dialog = remote.dialog;
// グラフ描画用のモジュール
const D3GraphRenderer = require('./renderer/D3GraphRenderer.js');
// マップ描画用のモジュール
const MapRenderer = require('./renderer/MapRenderer.js');

function logAnalyzer() {
  // 静的なプロパティ
  this.configMap = {
    main_html : (function () {
      /*
        <div id="log-analyzer">
          <div id="log-analyzer-box">
            <input type="text" id="log-analyzer-form"/>
            <div id="log-analyzer-select-button">SELECT</div>
          </div>
          <nav class="tabs">
            <div id="log-analyzer-tab-graph" class="tab selected">
              <div class="tab-header"></div>
              <div class="tab-body">Graph</div>
            </div>
            <div id="log-analyzer-tab-map" class="tab">
              <div class="tab-header"></div>
              <div class="tab-body">Map</div>
            </div>
          </nav>
          <div id="log-analyzer-graph" class="tab-content selected"></div>
          <div id="log-analyzer-map" class="tab-content"></div>
        </div>
      */}).toString().replace(/(\n)/g, '').split('*')[1],
    graph_value_map : require('./config/logged_values.js').values
  };
  // 動的なプロパティ
  this.stateMap = {
    $append_target  : undefined,
    logFilePath     : undefined,
    logFileSettings : undefined
  };
  // jQuery オブジェクトキャッシュ用
  this.jqueryMap = {};
  // jQuery
  this.$ = require('./lib/jquery-3.1.0.min.js');

  // レンダリング用モジュールの初期化
  var keymap = [];
  this.configMap.graph_value_map.forEach( function ( data ) {
    keymap.push(data.id);
  }.bind(this));
  this.graphRenderer = new D3GraphRenderer( keymap, keymap, null, "log-analyzer-graph" );
  this.mapRenderer   = new MapRenderer();
};


/***** イベントハンドラ *****/

/**
 * ファイル選択ボタン押下時に呼び出されるイベントハンドラ
 *
 * ファイル選択用のフォームを開き，ユーザにファイルを選択させる．
 * ファイルが選択されると，それを DOM 要素に反映しつつ，プロパティに保持する．
 */
logAnalyzer.prototype.onSelectFile = function () {
  Dialog.showOpenDialog(null, {
    properties: ['openFile'],
    title: 'ログファイルの選択',
    defaultPath: '.',
    filters: [
      {name: 'JSONファイル', extensions: ['json']}
    ]
  }, ( fileNames ) => {
    // プロパティに保持
    this.stateMap.logFilePath = fileNames[0];
    // DOM 要素への描画
    // TODO: ファイルパスが長いと見辛いので，どうにかする
    this.jqueryMap.$form.val(fileNames[0]);

    // ログファイルの読み込みに失敗したら何もしない
    // TODO: ユーザへのメッセージの描画
    var values = this.getLogFileData();
    if ( values === null ) { return; }

    // グラフの描画
    this.onRenderGraphFromLogFile( values );
    this.onRenderMapFromLogFile( values );
  });
};

/**
 * ログファイル選択時に呼び出されるイベントハンドラ
 */
logAnalyzer.prototype.onRenderGraphFromLogFile = function ( values ) {
  this.graphRenderer.initialize();

  for (var i=0; i<Object.keys(values).length; i++) {
    var obj = JSON.parse(values[i]);
    Object.keys(obj).forEach(function(key) {
      this.graphRenderer.update(key, obj["clock"], obj[key]);
    }.bind(this));
  }

  this.graphRenderer.renderAll(null, null, ["brush", "focus", "mark"]);
};

/**
 * マップ描画時に呼び出されるイベントハンドラ
 */
logAnalyzer.prototype.onRenderMapFromLogFile = function ( values ) {
  if ( this.stateMap.logFileSettings == undefined ) { return; }

  this.mapRenderer.init( this.jqueryMap.$content_map, this.stateMap.logFileSettings.map, this.onSelectData.bind(this) );

  for (var i=0; i<Object.keys(values).length; i++) {
    var obj = JSON.parse(values[i]);
    this.mapRenderer.render( obj.coordinate_x/10, obj.coordinate_y/10 );
  }
};

/**
 * マップ上のデータ選択時に呼び出されるイベントハンドラ
 */
logAnalyzer.prototype.onSelectData = function ( index ) {
  this.graphRenderer.onRenderMark(index);
};

/**
 * タブ選択時に呼び出されるコールバック関数
 *
 * 選択されたタブに応じて描画を切り替える．
 */
logAnalyzer.prototype.onSelectTab = function ( event ) {
  // 既に選択済みのタブ等から選択を外す
  // TODO: 選択したタブ等は dom を参照するのではなくメモリ上に保存すべき
  this.jqueryMap.$append_target.find(".selected").removeClass("selected");

  switch ( event.currentTarget.id ) {
  case "log-analyzer-tab-graph":
    this.jqueryMap.$tab_graph.addClass("selected");
    this.jqueryMap.$content_graph.addClass("selected");
    break;
  case "log-analyzer-tab-map":
    this.jqueryMap.$tab_map.addClass("selected");
    this.jqueryMap.$content_map.addClass("selected");
    break;
  }
};


/****************************/


/**
 * ログファイルからデータを取得する
 *
 * @return データの読み込みに成功した場合は，JSON 文字列が格納された配列を返す
 *         読み込みに失敗した場合は null を返す
 *         <ログファイルの形式について>
 *         ログファイルは，header と body の2つからなる
 *         また，header と body との間は `EOF` という文字列の行で区切られる
 *         - header : ログファイル固有の設定情報．1行で表すものとする．
 *         - body   : ログデータ
 */
logAnalyzer.prototype.getLogFileData = function () {
  if ( this.stateMap.logFilePath === undefined ) { return null; }

  var fs = require('fs');
  var values = new Array();

  // TODO: ファイルを開くのに失敗した場合のエラー処理
  var contents = fs.readFileSync(this.stateMap.logFilePath);

  var lines = contents
        .toString()
        .split('\n');
  // ヘッダー部分の読み込み
  var i = 0;
  for (; i<lines.length; i++) {
    if ( lines[i] === "EOH" ) {
      i++;
      break;
    }
    this.stateMap.logFileSettings = JSON.parse(lines[i]);
  }
  for (; i<lines.length; i++) {
    values.push(lines[i]);
  }

  // 最後に余分な改行があるので削除
  values.pop();

  return values;
};

/**
 * jQuery オブジェクトをキャッシュする
 *
 * この機能モジュール内で使用する jQuery オブジェクトをキャッシュしておく
 * これを行うことで，目的の DOM を取得するためにいちいち id や class で検索する
 * 手間が省ける上に，パフォーマンスが向上する．
 */
logAnalyzer.prototype.setJqueryMap = function () {
  var $append_target = this.stateMap.$append_target;
  this.jqueryMap = {
    $append_target : $append_target,
    $tab           : $append_target.find(".tab"),
    $form          : $append_target.parent().find("#log-analyzer-form"),
    $select_button : $append_target.parent().find("#log-analyzer-select-button"),
    $tab_graph     : $append_target.find("#log-analyzer-tab-graph"),
    $tab_map       : $append_target.find("#log-analyzer-tab-map"),
    $content_graph : $append_target.find("#log-analyzer-graph"),
    $content_map   : $append_target.find("#log-analyzer-map")
  };
};

/**
 * 機能モジュールの初期化
 */
logAnalyzer.prototype.init = function ( $append_target ) {
  // この機能モジュールの DOM 要素をターゲットに追加
  this.stateMap.$append_target = $append_target;
  $append_target.html( this.configMap.main_html );
  // jQuery オブジェクトをキャッシュ
  this.setJqueryMap();

  // イベントハンドラを登録
  this.jqueryMap.$select_button.bind( "click", this.onSelectFile.bind(this) );
  this.jqueryMap.$tab.bind( 'click', this.onSelectTab.bind(this) );
};

/**
 * 機能モジュールの削除
 *
 * 追加した DOM 要素を削除し，動的プロパティを初期化する
 * FIXME: 二重に remove を呼び出したときにエラーとなる
 */
logAnalyzer.prototype.remove = function () {
  // DOM 要素削除
  if ( Object.keys(this.jqueryMap).length != 0 ) {
    this.stateMap.$append_target.find("#log-analyzer").remove();
    this.jqueryMap = {};
  }

  // 動的プロパティの初期化
  this.stateMap = {
    $append_target : undefined,
    logFilePath    : undefined
  };
};

module.exports = logAnalyzer;
