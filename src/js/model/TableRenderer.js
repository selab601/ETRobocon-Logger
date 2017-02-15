function TableRenderer ( keymap, render_keymap ) {
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
  this.stateMap = {
    $append_target : undefined,
    all_keymap: keymap,
    render_value_keymap: render_keymap
  };
  this.jqueryMap = {};

  this.$ = require('./lib/jquery-3.1.0.min.js');
};

TableRenderer.prototype.initTableTuples = function () {
  this.stateMap.all_keymap.forEach( function ( key ) {
    var base_html = this.$(this.configMap.tuple_base_html);
    base_html.find('.table-renderer-key')
      .text( key );
    base_html.find('.table-renderer-value')
      .text("---");
    this.jqueryMap.$table_renderer_box.append(base_html);
  }.bind(this));
};

TableRenderer.prototype.setJqueryMap = function () {
  var $append_target = this.stateMap.$append_target;
  this.jqueryMap = {
    $append_target : $append_target,
    $table_renderer_box : $append_target.find("#table-renderer-box")
  };
};

TableRenderer.prototype.initModule = function ( $append_target ) {
  this.stateMap.$append_target = $append_target;
  $append_target.html( this.configMap.main_html );
  this.setJqueryMap();
  this.initTableTuples();
};

module.exports = TableRenderer;
