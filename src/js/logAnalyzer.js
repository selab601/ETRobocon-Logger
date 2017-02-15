/**
 * ログファイルの描画モジュール
 */

// ファイル選択のためのモジュール
const remote = require('electron').remote;
const Dialog = remote.dialog;
// グラフ描画用のモジュール
const D3GraphRenderer = require('./renderer/D3GraphRenderer.js');

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
          <div id="log-analyzer-graph"></div>
        </div>
      */}).toString().replace(/(\n)/g, '').split('*')[1],
    graph_value_map : require('./config/logged_values.js').values
  };
  // 動的なプロパティ
  this.stateMap = {
    $append_target : undefined,
    logFilePath    : undefined
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
  this.graphRenderer = new D3GraphRenderer( keymap, keymap, 100, "log-analyzer-graph" );
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

    // グラフの描画
    this.onRenderGraphFromLogFile();
  });
};

/**
 * ログファイル選択時に呼び出されるイベントハンドラ
 */
logAnalyzer.prototype.onRenderGraphFromLogFile = function () {
  // ログファイルの読み込みに失敗したら何もしない
  // TODO: ユーザへのメッセージの描画
  var values = this.getLogFileData();
  if ( values === null ) { return; }

  this.graphRenderer.initialize();

  for (var i=0; i<Object.keys(values).length; i++) {
    var obj = JSON.parse(values[i]);
    Object.keys(obj).forEach(function(key) {
      this.graphRenderer.update(key, obj["clock"], obj[key]);
    }.bind(this));
  }

  this.graphRenderer.renderAll();
  this.graphRenderer.addBrush();
};

/****************************/


/**
 * ログファイルからデータを取得する
 *
 * @return データの読み込みに成功した場合は，JSON 文字列が格納された配列を返す
 *         例) [ { / JSON / }, { / JSON / }, ... , { / JSON / }]
 *         読み込みに失敗した場合は null を返す
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
  for (var i=0; i<lines.length; i++) {
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
    $form          : $append_target.parent().find("#log-analyzer-form"),
    $select_button : $append_target.parent().find("#log-analyzer-select-button")
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
};

/**
 * 機能モジュールの削除
 *
 * 追加した DOM 要素を削除し，動的プロパティを初期化する
 * FIXME: 二重に remove を呼び出したときにエラーとなる
 */
logAnalyzer.prototype.remove = function () {
  // DOM 要素削除
  this.stateMap.$append_target.find("#log-analyzer").remove();
  this.jqueryMap = {};

  // 動的プロパティの初期化
  this.stateMap = {
    $append_target : undefined,
    logFilePath    : undefined
  };
};

module.exports = logAnalyzer;
