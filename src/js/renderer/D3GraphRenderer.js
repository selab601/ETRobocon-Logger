/*
 * D3GraphRenderer.js
 * 複数のグラフをとりまとめて管理するモジュール
 */
"use-strict";

var D3Graph = require("./D3graph.js");

function D3GraphRenderer ( all_keymap ) {
  this.configMap = {
    main_html : (function () {
      /*
        <div id="graphrenderer-list-box">
          <div class="graphrenderer-list-header">
            Render Graph
          </div>
            <div class="graphrenderer-list"></div>
          </div>
          <div id="graphrenderer-content-graph-box"></div>
        </div>
      */
    }).toString().replace(/(\n)/g, '').split('*')[1],
    graph_value_base_html : (function () {
      /*
        <div class="graphrenderer-list-val">
          <input type="checkbox" name="checkbox" />
          <label></label>
        </div>
      */}).toString().replace(/(\n)/g, '').split('*')[1]
  };
  this.stateMap = {
    $append_target      : undefined,
    all_keymap          : all_keymap,
    render_value_keymap : []
  };
  // jQuery
  this.$ = require('../lib/jquery-3.1.0.min.js');
  this.graphMap            = {};
};


/** レンダリング **/


/**
 * 機能モジュールの初期化
 */
D3GraphRenderer.prototype.init = function ( $append_target, maxXValueLength, onUpdateRenderValue, onRenderMarkOnMap ) {
  // DOM 要素削除
  this.removeAll();

  // この機能モジュールの DOM 要素をターゲットに追加
  this.stateMap.$append_target = $append_target;
  $append_target.html( this.configMap.main_html );
  this.stateMap.all_keymap.forEach( function ( key ) {
    this.graphMap[ key ]   = new D3Graph( key, maxXValueLength, "graphrenderer-content-graph-box", this.onRenderMark.bind(this) );
    this.graphMap[ key ].setOnRenderMarkOnMap( onRenderMarkOnMap );
  }.bind(this));

  // jQuery オブジェクトをキャッシュ
  this.setJqueryMap();

  /**
   * レンダリングするログ内の値のリストをビューに描画する
   *
   * ログには多数の種類の値が保持されており，その種類は本モジュールの configMap
   * 内に保持されている．
   * 負荷対策のため，グラフの描画時にはそれらの中からどの種類の値についてグラフ
   * を描画するか選択し，選択されたグラフのみを描画する．
   * この選択を行うために，ログファイル内の値の種類の一覧を描画する必要がある．
   */
  this.stateMap.all_keymap.forEach( function ( value ) {
    var base_html = this.$( this.configMap.graph_value_base_html );
    base_html.find( 'input' )
      .attr( 'id', value )
      .bind( 'click', value.id, this.onUpdateRenderValue.bind(this) );
    base_html.find( 'label' )
      .attr( 'for', value )
      .text( value );
    this.jqueryMap.$list.append( base_html );
  }.bind(this));

  this.onUpdateRenderValue = onUpdateRenderValue;
};

/**
 * jQuery オブジェクトをキャッシュする
 *
 * この機能モジュール内で使用する jQuery オブジェクトをキャッシュしておく
 * これを行うことで，目的の DOM を取得するためにいちいち id や class で検索する
 * 手間が省ける上に，パフォーマンスが向上する．
 */
D3GraphRenderer.prototype.setJqueryMap = function () {
  var $append_target = this.stateMap.$append_target;
  this.jqueryMap = {
    $append_target : $append_target,
    $list          : $append_target.find(".graphrenderer-list")
  };
};

/**
 * 描画対象の値の種類一覧において種類の選択/非選択が切り替わった際に呼び出されるイベントハンドラ
 *
 * 選択状況をプロパティに保持する．
 * また，ログファイルからのデータ読み込み用コールバックが登録されている場合には，
 * ログファイルからデータを読み込みグラフを描画する．
 */
D3GraphRenderer.prototype.onUpdateRenderValue = function ( event ) {
  // 選択された値の種類をプロパティに保存する
  var index = this.stateMap.render_value_keymap.indexOf( event.target.id );
  if ( index >= 0 ) {
    this.stateMap.render_value_keymap.splice(index,1);
    this.remove( event.target.id );
  } else {
    this.stateMap.render_value_keymap.push( event.target.id );
  }

  if ( this.onUpdateRenderValue != undefined ) {
    this.onUpdateRenderValue();
  }
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
  this.stateMap.render_value_keymap.forEach( function ( key ) {
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
      graph.onRenderMark();
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
  for (var i=0; i<this.stateMap.render_value_keymap.length; i++) {
    this.graphMap[this.stateMap.render_value_keymap[i]].onRenderMark();
  }
};

D3GraphRenderer.prototype.enableMark = function () {
  Object.keys(this.graphMap).forEach(function( key ) {
    this.graphMap[key].enableMark();
  }.bind(this));
};

module.exports = D3GraphRenderer;
