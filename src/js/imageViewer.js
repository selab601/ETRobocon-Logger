// ファイル選択のためのモジュール
const remote = require('electron').remote;
const Dialog = remote.dialog;

function imageViewer () {
  // 静的プロパティ
  this.configMap = {
    main_html : (function () {
      /*
        <div class="imageviewer">
          <div class="imageviewer-title">
            Preview
            <div class="imageviewer-scaledown-button">
              <img src="resources/scaledown_icon.png">
            </div>
            <input type="text" class="imageviewer-scale-form"/>
            <div class="imageviewer-scaleup-button">
              <img src="resources/scaleup_icon.png">
            </div>
          </div>
          <div class="imageviewer-preview-box"></div>
        </div>
      */}).toString().replace(/(\n)/g, '').split('*')[1]
  };
  // 動的プロパティ
  this.stateMap = {
    $append_target      : undefined,
    image_path          : undefined,
    image_scale         : undefined,
    image_original_size : undefined,
    // デバイスの出発位置．マップ描画時に利用する
    start_point         : undefined,
    start_point_rotate  : undefined
  };
  this.flags = {
    enableStartPointSetting : false
  };
  // jQuery オブジェクトのキャッシュ用
  this.jqueryMap = {};
  // jQuery
  this.$ = require('./lib/jquery-3.1.0.min.js');
};


/***** イベントハンドラ *****/

/**
 * スケールアップボタン押下時に呼び出されるイベントハンドラ
 */
imageViewer.prototype.onScaleup = function ( event ) {
  if ( this.stateMap.image_scale >= 100 ) { return; }
  this.setScale( parseInt(this.stateMap.image_scale) + 10 );
};

/**
 * スケールダウンボタン押下時に呼び出されるイベントハンドラ
 */
imageViewer.prototype.onScaledown = function ( event ) {
  if ( this.stateMap.image_scale <= 10 ) { return; }
  this.setScale( parseInt(this.stateMap.image_scale) - 10 );
};

/**
 * テキストボックス内にスケールが入力され，フォーカスが外れた時に呼び出されるイベントハンドラ
 */
imageViewer.prototype.onScaleinput = function ( event ) {
  var scale = event.target.value;
  if ( isNaN(scale) == false && scale != null ) {
    this.setScale( scale );
  } else {
    this.jqueryMap.$scale_form.val(this.stateMap.image_scale);
  }
};

/**
 * 画像上でマウスクリックが行われた際に呼び出されるイベントハンドラ
 *
 * 画像の任意の箇所をクリックすることで，ロギング時に走行を開始する地点(スタート地点)が決定できる
 * WARNING: スタート地点登録フラグが有効の場合にのみ，このイベントハンドラを bind すべき
 */
imageViewer.prototype.onSetStartPoint = function ( event ) {
  var self = event.data.self;
  var offset = self.$(this).offset();
  /*     クリック位置   要素位置   */
  var x = event.pageX - offset.left;
  var y = event.pageY - offset.top;
  self.setStartPoint({ x : x, y : y });
};

/**
 * スケーリング時に実行するイベントハンドラを登録する
 */
imageViewer.prototype.setOnScaleCompleteHandler = function ( handler ) {
  this.onScaleComplete = handler;
};

/**
 * スタート地点登録時に実行するイベントハンドラを登録する
 */
imageViewer.prototype.setOnSetStartPointCompleteHandler = function ( handler ) {
  this.onSetStartPointComplete = handler;
};

/****************************/


/***** セッター *****/

/**
 * 画像をスケーリングする
 *
 * @param scale スケールする倍率 TODO: 値の検証
 */
imageViewer.prototype.setScale = function ( scale ) {
  scale = scale === undefined || scale === null ? 100 : scale;
  var pre_scale  = this.stateMap.image_scale;
  var scaledSize =  {
    width  : this.stateMap.image_original_size.width * scale/100,
    height : this.stateMap.image_original_size.height * scale/100
  };

  /*** DOM に描画 ***/
  this.jqueryMap.$scale_form.val(scale);
  this.jqueryMap.$image.css({ width: scaledSize.width, height: scaledSize.height });

  /*** プロパティに保持 ***/
  this.stateMap.image_scale = scale;

  if ( this.flags.enableStartPointSetting ) {
    this.updateStartPoint( scale, pre_scale );
  }

  if ( this.onScaleComplete != undefined ) {
    this.onScaleComplete( scale );
  }
};

/**
 * スタート地点を描画する
 *
 * @param start_point スタート地点の座標．プロパティに x, y を持つこと
 * @param scale       座標設定時の画像ののスケール．
 *                    指定しなかった場合は地震の image_scale プロパティで初期化する
 */
imageViewer.prototype.setStartPoint = function ( start_point, scale ) {
  scale = scale === undefined ? this.stateMap.image_scale : scale;

  /*** DOM に描画 ***/
  // スタート地点は1つのみ指定できる．よって，既に描画されていた場合は削除する
  if ( this.jqueryMap.$start_point != undefined ) {
    this.jqueryMap.$start_point.remove();
  }
  // 追加する DOM 要素の準備
  this.jqueryMap.$start_point =
    this.$("<img></img>")
    .attr("id", "imageviewer-startpoint")
    .attr("src", "./resources/device_icon.png")
    // WARNING: 画像の位置を調整する
    //          画像の中心がスタート地点になるようにしているが，微妙にずれている
    //          start_poing の座標の計算方法(マウスクリックからの座標の計算方法)にミスがあるかも...
    .css("left", (parseInt(start_point.x)-5)+"px")
    .css("top", (parseInt(start_point.y)-10)+"px");
  // 追加
  this.jqueryMap.$image_wrapper
    .append( this.jqueryMap.$start_point );
  // 回転角度が指定されていたら反映する
  if ( this.stateMap.start_point_rotate != undefined ) {
    this.rotateStartPoint( this.stateMap.start_point_rotate );
  }

  /*** プロパティに保持 ***/
  this.stateMap.start_point = {
    x: Math.round(start_point.x * 100/scale),
    y: Math.round(start_point.y * 100/scale)
  };

  // スタート地点描画後のイベントハンドラが設定されていれば実行
  if ( this.onSetStartPointComplete != undefined ) {
    this.onSetStartPointComplete( this.stateMap.start_point );
  }
};

/**
 * スタート地点の描画位置を，スケールの変更に合わせて更新する
 *
 * @param scale     更新後のスケール
 * @param pre_scale 更新前のスケール
 */
imageViewer.prototype.updateStartPoint = function ( scale, pre_scale ) {
  if ( this.jqueryMap.$start_point === undefined ) { return; }

  /*** DOM に描画 ***/
  var s = ( scale / pre_scale );
  this.jqueryMap.$start_point.css({
    left: function(index, value) {
      return parseFloat(value) * s;
    },
    top: function(index, value) {
      return parseFloat(value) * s;
    }
  });
};

/**
 * プレビュー表示部分に画像を新規に描画する
 * @param src           画像のソース
 * @param original_size 画像の元サイズ
 * @param scale         画像の初期スケール
 */
imageViewer.prototype.setImage = function ( src, original_size, scale ) {
  // スケールが未定義の場合は 100% として処理を進める
  scale = scale == undefined ? 100 : scale;

  /*** DOM に描画 ***/
  // キャッシュ
  this.jqueryMap.$image_wrapper =
    this.$('<div></div>')
    .attr("class", "imageviewer-image-wrapper");
  this.jqueryMap.$image =
    this.$('<img>')
    .attr("src", src);
  // 描画
  this.jqueryMap.$preview_box.html(
    this.jqueryMap.$image_wrapper.append( this.jqueryMap.$image ));
  // スケールの反映
  var self = this;
  this.jqueryMap.$scale_form
    .val(scale)
    .css({ pointerEvents : "auto" });
  this.jqueryMap.$image
    .css({ width: original_size.width * scale/100, height: original_size.height * scale/100 });
  // スタート地点を登録する場合には，そのためのイベントハンドラを設定する
  if ( this.flags.enableStartPointSetting ) {
    this.jqueryMap.$image
      .bind( "click", {self:this}, this.onSetStartPoint );
  }

  /*** プロパティに保持 ***/
  this.stateMap.image_path          = src;
  this.stateMap.image_scale         = scale;
  this.stateMap.image_original_size = original_size;
};

/********************/

/**
 * スタート地点を回転する
 * DOM への反映と，回転量のプロパティへの保持を行う
 */
imageViewer.prototype.rotateStartPoint = function ( rotate_value ) {
  // DOM 要素に描画
  if ( this.jqueryMap.$start_point != undefined ) {
    this.jqueryMap.$start_point
      .css("transform", "rotate("+rotate_value+"deg)");
  }
  // プロパティに保持
  this.stateMap.start_point_rotate = rotate_value;
};

/**
 * jQuery オブジェクトをキャッシュする
 *
 * この機能モジュール内で使用する jQuery オブジェクトをキャッシュしておく
 * これを行うことで，目的の DOM を取得するためにいちいち id や class で検索する
 * 手間が省ける上に，パフォーマンスが向上する．
 */
imageViewer.prototype.setJqueryMap = function () {
  var $append_target = this.stateMap.$append_target;
  this.jqueryMap = {
    $append_target    : $append_target,
    $imageviewer      : $append_target.find(".imageviewer"),
    $scale_form       : $append_target.find(".imageviewer-scale-form"),
    $scaleup_button   : $append_target.find(".imageviewer-scaleup-button"),
    $scaledown_button : $append_target.find(".imageviewer-scaledown-button"),
    $preview_box      : $append_target.find(".imageviewer-preview-box"),
    $image            : undefined,
    $image_wrapper    : undefined
  };
};

/**
 * 機能モジュールの初期化
 */
imageViewer.prototype.init = function ( $append_target ) {
  // この機能モジュールの DOM 要素をターゲットに追加
  this.stateMap.$append_target = $append_target;
  $append_target.append( this.configMap.main_html );
  // jQuery オブジェクトをキャッシュ
  this.setJqueryMap();

  // スタート地点設定の有効化
  // TODO: モジュール外部から切り替え可能にする
  this.flags.enableStartPointSetting = true;

  // イベントハンドラの登録
  this.jqueryMap.$scale_form.bind( "change", this.onScaleinput.bind(this) );
  this.jqueryMap.$scaleup_button.bind( "click", this.onScaleup.bind(this) );
  this.jqueryMap.$scaledown_button.bind( "click", this.onScaledown.bind(this) );
};

/**
 * 機能モジュールの削除
 *
 * 追加した DOM 要素を削除し，動的プロパティを初期化する
 */
imageViewer.prototype.remove = function () {
  // DOM 要素の削除
  if ( Object.keys(this.jqueryMap).length != 0 ) {
    this.stateMap.$append_target.find(".imageviewer").remove();
    this.jqueryMap = {};
  }

  // 動的プロパティの初期化
  this.stateMap = {
    $append_target      : undefined,
    image_path          : undefined,
    image_scale         : undefined,
    image_original_size : undefined,
    start_point         : undefined,
    start_point_rotate  : undefined
  };
};

module.exports = imageViewer;
