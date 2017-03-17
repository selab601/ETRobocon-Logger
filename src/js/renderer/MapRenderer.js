var Map = require("./Map.js");
var ImageViewer = require("../imageViewer.js");

/**
 * @param map_settings map_start_point，map_image_path をもつべき
 */
function MapRenderer () {
  this.configMap = {
    main_html : (function () {
      /*
        <div id="maprenderer-box"></div>
      */}).toString().replace(/(\n)/g, '').split('*')[1]
  };
  // 動的プロパティ
  this.stateMap = {
    $append_target : undefined
  };
  // jQuery オブジェクトキャッシュ用
  this.jqueryMap = {};
  this.map = undefined;
  this.imageViewer = new ImageViewer();
};

MapRenderer.prototype.setJqueryMap = function () {
  var $append_target = this.stateMap.$append_target;
  this.jqueryMap = {};
};

MapRenderer.prototype.render = function ( x, y, clock ) {
  if ( this.map === undefined ) { return; }
  this.map.render({x: x, y: y}, clock);
};

MapRenderer.prototype.init = function ( $append_target, map_settings, onSelectData ) {
  this.stateMap.$append_target = $append_target;
  $append_target.html( this.configMap.main_html );
  this.setJqueryMap();

  // マップの初期化
  // TODO: 設定がされていない場合には警告を出す
  if (
    map_settings.image_path != ''
      && map_settings.image_original_size != ''
      && map_settings.start_point != ''
  ) {
    this.imageViewer.init(this.stateMap.$append_target.find("#maprenderer-box"));
    this.imageViewer.setImage(map_settings.image_path, map_settings.image_original_size);

    var cor = { x: map_settings.start_point.x, y: map_settings.start_point.y };
    this.map = new Map(
      "imageviewer-image-wrapper",
      map_settings.image_original_size.width,
      map_settings.image_original_size.height,
      { x: cor.x, y: cor.y },
      map_settings.draw_scale,
      onSelectData,
      map_settings.draw_rotate
    );
    this.map.init();
    this.imageViewer.setOnScaleCompleteHandler( this.map.scale.bind(this.map) );
  }
};

/**
 * マークが描画された際に実行されるイベントハンドラ
 * マップ以外の場所(グラフ上)で値がマークされた場合に呼び出されるイベントハンドラ
 * マップにマークを描画する。
 *
 * @param index マーク対象の値のインデックス
 */
MapRenderer.prototype.onRenderMark = function ( index ) {
  this.map.onRenderMark( index, false );
};

module.exports = MapRenderer;
