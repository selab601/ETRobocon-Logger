var Map = require("./Map.js");

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
};

MapRenderer.prototype.setJqueryMap = function () {
  var $append_target = this.stateMap.$append_target;
  this.jqueryMap = {};
};

MapRenderer.prototype.render = function ( x, y ) {
  if ( this.map === undefined ) { return; }
  this.map.render({x: x, y: y});
};

MapRenderer.prototype.init = function ( $append_target, map_settings ) {
  this.stateMap.$append_target = $append_target;
  $append_target.html( this.configMap.main_html );
  this.setJqueryMap();

  // マップの初期化
  // TODO: 設定がされていない場合には警告を出す
  if ( map_settings != undefined ) {
    var image = new Image();
    image.src = map_settings.map_image_path;
    var cor = { x: map_settings.map_start_point.x, y: map_settings.map_start_point.y };
    this.map = new Map( "maprenderer-box", image.width, image.height, { x: cor.x, y: cor.y }, map_settings.map_image_path );
    this.map.init();
  }
};

module.exports = MapRenderer;
