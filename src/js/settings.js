
// ファイル選択のためのモジュール
const remote = require('electron').remote;
const Dialog = remote.dialog;

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
              <div class="settings-map-image-preview">
                <div class="settings-map-image-preview-title">
                  Preview
                  <div class="settings-map-image-form-scaleup-button">
                    <img src="resources/scaleup_icon.png">
                  </div>
                  <input type="text" class="settings-map-image-form-scale"/>
                  <div class="settings-map-image-form-scaledown-button">
                    <img src="resources/scaledown_icon.png">
                  </div>
                </div>
                <div class="settings-map-image-preview-box"></div>
              </div>
            </div>
          </div>
        </div>
      */}).toString().replace(/(\n)/g, '').split('*')[1]
  };
  // 動的プロパティ
  this.stateMap = {
    $append_target : undefined,
    map_image_path : undefined,
    map_image_scale : undefined
  };
  // jQuery オブジェクトのキャッシュ用
  this.jqueryMap = {};
  // ユーザへ通知を行うコールバック関数
  this.messenger = undefined;
  // main プロセスとの通信用モジュール
  this.ipc = require('electron').ipcRenderer;
  // jQuery
  this.$ = require('./lib/jquery-3.1.0.min.js');
};


/******* イベントハンドラ *******/

Settings.prototype.onSelectImage = function ( event ) {
  Dialog.showOpenDialog(null, {
    properties: ['openFile'],
    defaultPath: '.',
    filters: [
      {name: 'Image file', extensions: ['png', 'jpg', 'jpeg']}
    ]
  }, function(files){
    // プロパティに保持
    this.stateMap.map_image_path = files[0];
    // DOM に描画
    this.jqueryMap.$image_form.val( files[0] );

    // プレビュー画像を描画する
    this.jqueryMap.$image_preview_imgwrapper =
      this.$('<div></div>')
      .attr("class", "settings-map-image-preview-imagewrapper");
    this.jqueryMap.$image_preview_img =
      this.$('<img>')
      .attr("src", files[0]);
    this.jqueryMap.$image_preview.html(
      this.jqueryMap.$image_preview_imgwrapper.append(
        this.jqueryMap.$image_preview_img
      ));

    // イベントハンドラ登録
    this.jqueryMap.$image_preview_img
      .bind( "click", {self:this}, this.onClickedImage)
      // 画像読み込み後に初期スケールを調整する
      .bind ("load", function () {
        this.onAdjustScale( 100 );
      }.bind(this));
  }.bind(this));
};

Settings.prototype.onClickedImage = function ( event ) {
  var self = event.data.self;
  var offset = self.$(this).offset();
  var x = event.pageX - offset.left;
  var y = event.pageY - offset.top;

  if ( self.jqueryMap.$image_preview_img_point != undefined ) {
    self.jqueryMap.$image_preview_img_point.remove();
  }

  // クリック位置をプロパティに保存

  // DOM に描画
  self.jqueryMap.$image_preview_img_point =
    self.$("<div></div>")
    .attr("id", "settings-map-image-preview-point")
    .css("left", Math.round(x)+"px")
    .css("top", Math.round(y)+"px");
  self.jqueryMap.$image_preview_imgwrapper
    .append( self.jqueryMap.$image_preview_img_point );
};

Settings.prototype.onScaleupPreview = function ( event ) {
  if ( this.stateMap.map_image_scale >= 100 ) { return; }
  this.onAdjustScale( this.stateMap.map_image_scale + 10 );
};

Settings.prototype.onScaledownPreview = function ( event ) {
  if ( this.stateMap.map_image_scale <= 10 ) { return; }
  this.onAdjustScale( this.stateMap.map_image_scale - 10 );
};

Settings.prototype.onScale = function ( event ) {
  var scale = event.target.value;
  this.onAdjustScale( scale );
};

/**
 * 画像のスケールを調整する
 */
Settings.prototype.onAdjustScale = function ( scale ) {
  var originalScale = getOriginalScale( this.stateMap.map_image_path );
  this.jqueryMap.$image_preview_img.css({
    width: originalScale.width, height: originalScale.height
  });

  this.jqueryMap.$image_scale.val(this.stateMap.map_image_scale);
  this.jqueryMap.$image_preview_img.css({
    width: function(index, value) {
      return parseFloat(value) * scale/100;
    },
    height: function(index, value) {
      return parseFloat(value) * scale/100;
    }
  });

  console.log(this.jqueryMap.$image_preview_img[0].width);
  console.log(this.jqueryMap.$image_preview[0].clientHeight);
  console.log(this.jqueryMap.$image_preview[0].clientWidth);
  this.jqueryMap.$image_preview_imgwrapper
    .css("left", this.jqueryMap.$image_preview_img[0].width/2 - this.jqueryMap.$image_preview[0].clientWidth/2 + 5)
    .css("top", this.jqueryMap.$image_preview_img[0].height/2 - this.jqueryMap.$image_preview[0].clientHeight/2 + 5);

  // デバイスの初期位置の point を更新
  if ( this.jqueryMap.$image_preview_img_point != undefined ) {
    var s = ( scale / this.stateMap.map_image_scale );
    this.jqueryMap.$image_preview_img_point.css({
      left: function(index, value) {
        return parseFloat(value) * s;
      },
      top: function(index, value) {
        return parseFloat(value) * s;
      }
    });
  }

  this.stateMap.map_image_scale = scale;
  this.jqueryMap.$image_scale.val(this.stateMap.map_image_scale);
};

/********************************/

function getOriginalScale ( src ) {
  var image = new Image();
  image.src = src;
  return { width: image.width, height: image.height };
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
    $image_preview       : $append_target.find(".settings-map-image-preview-box"),
    $image_form          : $append_target.find(".settings-map-image-form-body"),
    $image_scale         : $append_target.find(".settings-map-image-form-scale"),
    $image_scaleup_button : $append_target.find(".settings-map-image-form-scaleup-button"),
    $image_scaledown_button : $append_target.find(".settings-map-image-form-scaledown-button")
  };
};

/**
 * 機能モジュールの初期化
 */
Settings.prototype.init = function ( $append_target, deviceMap, callback, messenger ) {
  // この機能モジュールの DOM 要素をターゲットに追加
  this.stateMap.$append_target = $append_target;
  $append_target.append( this.configMap.main_html );
  // jQuery オブジェクトをキャッシュ
  this.setJqueryMap();

  // イベントハンドラの登録
  this.jqueryMap.$image_search_button.bind( "click", this.onSelectImage.bind(this) );
  this.jqueryMap.$image_scale.bind( "change", this.onScale.bind(this) );
  this.jqueryMap.$image_scaleup_button.bind( "click", this.onScaleupPreview.bind(this) );
  this.jqueryMap.$image_scaledown_button.bind( "click", this.onScaledownPreview.bind(this) );
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
