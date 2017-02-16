/*
 * D3GraphRenderer.js
 * 複数のグラフをとりまとめて管理するモジュール
 */
"use-strict";

var D3Graph = require("./D3graph.js");

function D3GraphRenderer ( all_keymap, render_value_keymap, maxXValueLength, append_target_id ) {
  this.all_keymap          = all_keymap;
  this.render_value_keymap = render_value_keymap;
  this.graphMap            = {};
  this.all_keymap.forEach( function ( key ) {
    this.graphMap[ key ]   = new D3Graph( key, maxXValueLength, append_target_id, this.onRenderMark.bind(this) );
  }.bind(this));
};

/**
 * 全グラフの初期化
 *
 * 全グラフのデータのリセットと，スタイルのリセット
 */
D3GraphRenderer.prototype.initialize = function () {
  Object.keys( this.graphMap ).forEach( function ( key ) {
    this.graphMap[key].clearData();
    this.graphMap[key].resetStyle();
  }.bind(this));
  this.removeAll();
};


/***** グラフの操作 *****/

/**
 * グラフの値の更新
 * @param key    更新対象のグラフの ID
 * @param xValue 更新値(X)
 * @param yValue 更新値(Y)
 */
D3GraphRenderer.prototype.update = function (key, xValue, yValue) {
  this.graphMap[key].appendData(xValue, yValue);
};

/**
 * 全グラフの描画
 *
 * @param xScope  描画範囲(X軸)
 * @param yScope  描画範囲(Y軸)
 * @param options 描画オプション
 */
D3GraphRenderer.prototype.renderAll = function (xScope, yScope, options) {
  this.render_value_keymap.forEach( function ( key ) {
    renderGraph( this.graphMap[key], xScope, yScope, options );
  }.bind(this));
};

/**
 * 単一のグラフの描画
 *
 * @param graph   描画対象の D3Graph
 * @param xScope  描画範囲(X軸)
 * @param yScope  描画範囲(Y軸)
 * @param options 描画オプション
 */
function renderGraph ( graph, xScope, yScope, options ) {
    graph.updateScale(xScope, yScope);
    graph.render();

    // TODO: options の検証
    /**
     * グラフに拡大/縮小機能を追加する．
     * blush オブジェクトとは，グラフ上でマウスドラッグした際に表示される
     * 半透明のボックスのこと．
     * このボックス内部が拡大して描画される．
     * グラフ内で通常の左クリックを行うと最初の縮尺に戻る．
     */
    var brush_rect = null;
    if (options.indexOf("brush") != -1) {
      graph.addBrush();
      brush_rect = graph.getBrushRect();
    }

    /**
     * フォーカスとは，グラフにマウスオーバーすると，直近の値の詳細をグラフ上に描画する機能
     */
    if (options.indexOf("focus") != -1) {
      graph.addFocus(brush_rect);
    }

    /**
     * マークとは，グラフ上で右クリックすることでグラフに印をつけられる機能
     * つけた印は前グラフ間で共有される
     * addMarkEvent で，マウスイベントをキャッチするためのイベントハンドラを登録する
     */
    if (options.indexOf("mark") != -1) {
      graph.addMarkEvent(brush_rect);
      graph.renderMark();
    }

    /**
     * グラフ上の各値に自動的に付加される Y 値のラベル
     */
    if (options.indexOf("label") != -1) {
      graph.addLabel();
    }
};

/**
 * 全グラフの削除
 */
D3GraphRenderer.prototype.removeAll = function () {
  Object.keys( this.graphMap ).forEach( function ( key ) {
    this.graphMap[key].remove();
  }.bind(this));
};

/**
 * 指定したグラフの削除
 * @param key 削除対象のグラフの ID
 */
D3GraphRenderer.prototype.remove = function ( key ) {
  this.graphMap[key].remove();
};

/************************/

/**
 * Graph 側でマークが追加された時，他の全てのグラフにもマークを追加する
 * まず，全てのグラフにマークを追加し，その後マークの描画を行う
 *
 * @param mark_index マークを追加するX軸データのインデックス
 */
D3GraphRenderer.prototype.onRenderMark = function ( mark_index ) {
  // 全グラフに，マークを設定する
  Object.keys(this.graphMap).forEach(function( key ) {
    this.graphMap[key].setMark( mark_index );
  }.bind(this));

  // 描画すべきグラフについては，マークを描画する
  for (var i=0; i<this.render_value_keymap.length; i++) {
    this.graphMap[this.render_value_keymap[i]].renderMark();
  }
};

module.exports = D3GraphRenderer;
