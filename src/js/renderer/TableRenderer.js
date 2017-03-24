/**
 * 各種ロギング値を表示したテーブルを描画する
 */

function TableRenderer ( keymap ) {
  // 静的プロパティ
  this.configMap = {
    main_html : (function () {
      /*
        <div id="table-renderer-box">
        </div>
      */}).toString().replace(/(\n)/g, '').split('*')[1],
    tuple_base_html : (function () {
      /*
        <div class="table-renderer-tuple">
          <div class="table-renderer-key"></div>
          <div class="table-renderer-value"></div>
        </div>
      */}).toString().replace(/(\n)/g, '').split('*')[1]
  };
  // 動的プロパティ
  this.stateMap = {
    $append_target      : undefined,
    all_keymap          : keymap
  };
  // jQuery オブジェクトキャッシュ用
  this.jqueryMap = {};
  // jQuery
  this.$ = require('../lib/jquery-3.1.0.min.js');
};

/**
 * テーブルの DOM 要素を初期化する
 *
 * keymap に含まれる，全てのロギング値分のテーブルを，
 * tuple_base_html を元に生成し，描画する．
 * WARING: モジュール初期化後に呼び出すこと
 */
TableRenderer.prototype.initTableTuples = function () {
  this.stateMap.all_keymap.forEach( function ( key ) {
    var base_html = this.$(this.configMap.tuple_base_html);
    base_html.find('.table-renderer-key')
      .text( key );
    var value = base_html.find('.table-renderer-value')
      .attr( 'id', key )
      .text("---");
    // DOM 要素に追加(レンダリング)する
    this.jqueryMap.$table_renderer_box.append(base_html);
    // キャッシュする
    this.jqueryMap.$table_renderer_table_values[key] = value;
  }.bind(this));
};

/**
 * テーブルの値を更新する
 * @param key   更新対象のテーブルの key
 * @param value 更新する値
 */
TableRenderer.prototype.update = function ( key, value ) {
  // DOM 要素が既に削除されていれば無視する
  if ( this.jqueryMap.$table_renderer_table_values === undefined ) { return; }
  this.jqueryMap.$table_renderer_table_values[key].text(value);
};

/**
 * jQuery オブジェクトをキャッシュする
 *
 * この機能モジュール内で使用する jQuery オブジェクトをキャッシュしておく
 * これを行うことで，目的の DOM を取得するためにいちいち id や class で検索する
 * 手間が省ける上に，パフォーマンスが向上する．
 */
TableRenderer.prototype.setJqueryMap = function () {
  var $append_target = this.stateMap.$append_target;
  this.jqueryMap = {
    $append_target               : $append_target,
    $table_renderer_box          : $append_target.find("#table-renderer-box"),
    $table_renderer_table_values : {}
  };
};

/**
 * 機能モジュールの削除
 *
 * 追加した DOM 要素を削除し，動的プロパティを初期化する
 * FIXME: 二重に remove を呼び出したときにエラーとなる
 */
TableRenderer.prototype.initModule = function ( $append_target ) {
  this.stateMap.$append_target = $append_target;
  $append_target.html( this.configMap.main_html );
  this.setJqueryMap();
  this.initTableTuples();
};

module.exports = TableRenderer;
