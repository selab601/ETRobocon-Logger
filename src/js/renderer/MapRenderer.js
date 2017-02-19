var Map = require("./Map.js");

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
  this.map = new Map( "maprenderer-box", 900, 500, { x: 100, y: 100 } );
};

MapRenderer.prototype.setJqueryMap = function () {
  var $append_target = this.stateMap.$append_target;
  this.jqueryMap = {};
};

MapRenderer.prototype.render = function ( x, y ) {
  this.map.render({x: x, y: y});
};

MapRenderer.prototype.init = function ( $append_target ) {
  this.stateMap.$append_target = $append_target;
  $append_target.html( this.configMap.main_html );
  this.setJqueryMap();

  this.map.init();
};

module.exports = MapRenderer;
