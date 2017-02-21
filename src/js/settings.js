// ファイル選択のためのモジュール
const remote = require('electron').remote;
const Dialog = remote.dialog;
const ImageViewer = require("./imageViewer.js");

function Settings () {
  // 静的プロパティ
  this.configMap = {
    main_html : (function () {
      /*
        <div id="settings-wrapper">
          <div id="settings">
            <div class="settings-map">
              <div class="settings-map-title">Map</div>
              <div class="settings-map-image-form">
                <div class="settings-map-image-form-title">Image :</div>
                <input type="text" class="settings-map-image-form-body"/>
                <div class="settings-map-image-form-button">
                  <img src="resources/search_icon.png">
                </div>
              </div>
            </div>
          </div>
        </div>
      */}).toString().replace(/(\n)/g, '').split('*')[1]
  };
  // 動的プロパティ
  this.stateMap = {
    $append_target : undefined
  };
  // jQuery オブジェクトのキャッシュ用
  this.jqueryMap = {};
  // jQuery
  this.$ = require('./lib/jquery-3.1.0.min.js');

  this.imageViewer = new ImageViewer();
};


/******* イベントハンドラ *******/

/**
 * 画像選択ボタン押下時に呼び出されるイベントハンドラ
 *
 * ユーザに画像ファイルを選択させ，選択された画像を imageViewer モジュールに描画させる
 */
Settings.prototype.onSelectImage = function ( event ) {
  Dialog.showOpenDialog(null, {
    properties: ['openFile'],
    defaultPath: '.',
    filters: [
      {name: 'Image file', extensions: ['png', 'jpg', 'jpeg']}
    ]
  }, function(files){
    // 入力欄を更新
    this.jqueryMap.$image_input_form.val( files[0] );
    // ImageViewer モジュールで画像を描画
    this.imageViewer.setImage( files[0] );
  }.bind(this));
};

/********************************/


/**
 * 既存の設定情報で設定画面を初期化する
 *
 * @param settings 保持するプロパティは以下
 *                   - map
 *                     - image_path
 *                     - image_scale
 *                     - start_point
 */
Settings.prototype.initializeSettings = function ( settings ) {
  if ( Object.keys(settings).length == 0 || settings === undefined ) { return; }

  if ( settings.map.image_path != undefined ) {
    this.imageViewer.setImage(
      settings.map.image_path,
      settings.map.image_scale
    );
    this.jqueryMap.$image_input_form.val(settings.map.image_path);
  }

  if ( settings.map.start_point != undefined ) {
    // start_point は，画像のサイズが 100% の時の画像上の座標を示している
    // よって，まずはスケール 100% に対しスタート地点を描画し，その後
    // 指定されたスケール(image_scale)にあわせた位置に描画を更新する
    this.imageViewer.setStartPoint(
      settings.map.start_point,
      100
    );
    this.imageViewer.updateStartPoint(
      settings.map.image_scale,
      100
    );
  }
};

Settings.prototype.getMapState = function () {
  return {
    image_path  : this.imageViewer.getImagePath(),
    image_scale : this.imageViewer.getImageScale(),
    start_point : this.imageViewer.getStartPoint()
  };
};

/**
 * jQuery オブジェクトをキャッシュする
 *
 * この機能モジュール内で使用する jQuery オブジェクトをキャッシュしておく
 * これを行うことで，目的の DOM を取得するためにいちいち id や class で検索する
 * 手間が省ける上に，パフォーマンスが向上する．
 */
Settings.prototype.setJqueryMap = function () {
  var $append_target = this.stateMap.$append_target;
  this.jqueryMap = {
    $append_target       : $append_target,
    $image_search_button : $append_target.find(".settings-map-image-form-button"),
    $image_input_form    : $append_target.find(".settings-map-image-form-body")
  };
};

/**
 * 機能モジュールの初期化
 */
Settings.prototype.init = function ( $append_target, settings ) {
  // この機能モジュールの DOM 要素をターゲットに追加
  this.stateMap.$append_target = $append_target;
  $append_target.append( this.configMap.main_html );
  // jQuery オブジェクトをキャッシュ
  this.setJqueryMap();

  // 機能モジュールの初期化
  this.imageViewer.init($append_target.find(".settings-map"));

  // 設定情報から設定画面を以前の設定が行われた状態に初期化する
  this.initializeSettings( settings );

  // イベントハンドラの登録
  this.jqueryMap.$image_search_button.bind( "click", this.onSelectImage.bind(this) );
};

/**
 * 機能モジュールの削除
 *
 * 追加した DOM 要素を削除し，動的プロパティを初期化する
 */
Settings.prototype.remove = function () {
  // DOM 要素の削除
  if ( Object.keys(this.jqueryMap).length != 0 ) {
    this.stateMap.$append_target.find("#settings-wrapper").remove();
    this.jqueryMap = {};
  }

  // 動的プロパティの初期化
  this.stateMap = {
    $append_target : undefined
  };
};

module.exports = Settings;
