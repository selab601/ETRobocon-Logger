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
    this.graphMap[ key ]   = new D3Graph( key, maxXValueLength, append_target_id, this.setMark.bind(this) );
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
 */
D3GraphRenderer.prototype.renderAll = function (xScope, yScope) {
  this.render_value_keymap.forEach( function ( key ) {
    this.graphMap[key].updateScale(xScope, yScope);
    this.graphMap[key].render();
  }.bind(this));
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


/***** グラフへの性質の追加 *****/

/**
 * 全グラフへ blush オブジェクトを追加
 *
 * グラフに拡大/縮小機能を追加する．
 * blush オブジェクトとは，グラフ上でマウスドラッグした際に表示される
 * 半透明のボックスのこと．
 * このボックス内部が拡大して描画される．
 * グラフ内で通常の左クリックを行うと最初の縮尺に戻る．
 */
D3GraphRenderer.prototype.addBrush = function () {
  this.all_keymap.forEach( function ( key ) {
    this.graphMap[key].addBrush();
  }.bind(this));
};

/**
 * 全グラフへラベルを追加
 *
 * グラフ上の各値に自動的に付加される Y 値のラベル
 */
D3GraphRenderer.prototype.addLabel = function () {
  this.all_keymap.forEach( function ( key ) {
    this.graphMap[key].addLabel();
  }.bind(this));
};

/**
 * 全グラフへフォーカスを追加
 *
 * フォーカスとは，グラフにマウスオーバーすると，直近の値の詳細をグラフ上に描画する機能
 */
D3GraphRenderer.prototype.addFocus = function () {
  this.all_keymap.forEach( function ( key ) {
    this.graphMap[key].addFocus();
  }.bind(this));
};

/**
 * 全グラフへマークを追加
 *
 * マークとは，グラフ上で右クリックすることでグラフに印をつけられる機能
 * つけた印は前グラフ間で共有される
 */
D3GraphRenderer.prototype.setMark = function (mark) {
  Object.keys(this.graphMap).forEach(function(key) {
    this.graphMap[key].setMark(mark);
  }.bind(this));

  for (var i=0; i<this.render_value_keymap.length; i++) {
    this.graphMap[this.render_value_keymap[i]].renderMark();
  }
};

/********************************/


module.exports = D3GraphRenderer;
