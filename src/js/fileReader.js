/**
 * ログファイル読み込み用の機能モジュール
 *
 * ユーザにログファイルを選択させ，選択されたログファイルからデータを読み込む．
 * WARNING: 読み込み可能なログファイルの形式は JSON 形式に限られる
 */

// ファイル選択のためのモジュール
const remote = require('electron').remote;
const Dialog = remote.dialog;

function fileReader() {
  // 静的プロパティ
  this.configMap = {
    main_html: (function () {
      /*
        <div id="file-reader">
          <input type="text" id="file-reader-form-input"/>
          <div id="file-reader-select-button">SELECT</div>
        </div>
      */}).toString().replace(/(\n)/g, '').split('*')[1]
  };
  // 動的プロパティ
  this.stateMap = {
    logFilePath    : undefined,
    $append_target : undefined
  };
}


/***** イベントハンドラ *****/

/**
 * 選択ボタン押下時に呼び出されるイベントハンドラ
 *
 * ファイル選択用のフォームを開き，ユーザにファイルを選択させる．
 * ファイルが選択されると，それを DOM 要素に反映しつつ，プロパティに保持する．
 */
fileReader.prototype.onSelectFile = function () {
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
    this.jqueryMap.$form_input.val(fileNames[0]);
  });
};

/***************************/


/**
 * ログファイルからデータを取得する
 *
 * @return データの読み込みに成功した場合は，JSON 文字列が格納された配列を返す
 *         例) [ { / JSON / }, { / JSON / }, ... , { / JSON / }]
 *         読み込みに失敗した場合は null を返す
 */
fileReader.prototype.getLogFileData = function () {
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
fileReader.prototype.setJqueryMap = function () {
  var $append_target = this.stateMap.$append_target;
  this.jqueryMap = {
    $append_target : $append_target,
    $form_input    : $append_target.parent().find("#file-reader-form-input"),
    $select_button : $append_target.parent().find("#file-reader-select-button")
  };
};

/**
 * 機能モジュールの初期化
 */
fileReader.prototype.init = function ( $append_target ) {
  // この機能モジュールの DOM 要素をターゲットに追加
  this.stateMap.$append_target = $append_target;
  $append_target.after( this.configMap.main_html );
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
fileReader.prototype.remove = function () {
  // DOM 要素削除
  this.stateMap.$append_target.find("#file-reader").remove();
  this.jqueryMap = {};

  // 動的プロパティの初期化
  this.stateMap = {
    logFilePath: undefined,
    $append_target: undefined
  };
};

module.exports = fileReader;
