/**
 * ユーザに向けたメッセージ表示のためのダイアログを出現させる機能モジュール
 *
 * ダイアログは描画後，ユーザの手動か，一定時間経つと消える
 */

function dialog() {
  // 静的プロパティ
  this.configMap = {
    main_html : (function () {
      /*
        <div id="dialog">
          <div id="dialog-delete-button">×</div>
          <div id="dialog-title"></div>
          <div id="dialog-body"></div>
        </div>
      */}).toString().replace(/(\n)/g, '').split('*')[1],
    // デフォルトでは 5 秒でタイムアウト
    default_timeout : 5000
  };
  // 動的プロパティ
  this.stateMap = {
    $append_target : undefined,
    timer : undefined
  };
  // jQuery オブジェクトキャッシュ用
  this.jqueryMap = {};
}

/**
 * ダイアログ表示時に呼び出されるイベントハンドラ
 * @param 表示タイトル
 * @param 表示内容
 * @param 表示スタイル(未実装)
 * @param 描画時間(任意．null の場合はデフォルト値となる)
 */
dialog.prototype.onShowDialog = function ( title, body, style, duration ) {
  this.jqueryMap.$dialog_title.text(title);
  // WARNING: 改行文字(<br>)がエスケープされてしまうので，text() -> html() に変更
  //          ただし，当然ながらエスケープされないくなるという問題がある
  this.jqueryMap.$dialog_body.html(body);

  // ダイアログ非表示までのタイマーが既に設定されていた場合は，上書きのためにリセットする
  if ( this.timer != undefined ) {
    clearTimeout( this.timer );
  }

  // ダイアログを表示する
  this.jqueryMap.$dialog.css("display", "inline-block");

  var d = duration === undefined ? this.configMap.default_timeout : duration;
  this.timer = setTimeout(function () {
    // 指定時間後にダイアログを隠す
    this.jqueryMap.$dialog.css("display","none");
  }.bind(this), d);
};

/**
 * ダイアログの消去ボタン押下時に呼び出されるイベントハンドラ
 *
 * ダイアログの DOM 要素を非表示にする
 * タイマーが動いている場合は停止する
 */
dialog.prototype.onDeleteDialog = function () {
  if ( this.timer != undefined ) {
    clearTimeout( this.timer );
  }
  this.jqueryMap.$dialog.css("display", "none");
};

/**
 * jQuery オブジェクトをキャッシュする
 *
 * この機能モジュール内で使用する jQuery オブジェクトをキャッシュしておく
 * これを行うことで，目的の DOM を取得するためにいちいち id や class で検索する
 * 手間が省ける上に，パフォーマンスが向上する．
 */
dialog.prototype.setJqueryMap = function () {
  var $append_target = this.stateMap.$append_target;
  this.jqueryMap = {
    $dialog       : $append_target.find("#dialog"),
    $dialog_title : $append_target.find("#dialog-title"),
    $dialog_delete_button: $append_target.find("#dialog-delete-button"),
    $dialog_body  : $append_target.find("#dialog-body")
  };
};

dialog.prototype.init = function ( $append_target ) {
  // この機能モジュールの DOM 要素をターゲットに追加
  this.stateMap.$append_target = $append_target;
  $append_target.append( this.configMap.main_html );
  // jQuery オブジェクトをキャッシュ
  this.setJqueryMap();

  // イベントハンドラ登録
  this.jqueryMap.$dialog_delete_button.bind( "click", this.onDeleteDialog.bind(this) );
};

module.exports = dialog;
