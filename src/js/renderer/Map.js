function Map ( $append_target_id, width, height, origin, drawScale, onRenderMarkOnGraph, theta ) {
  this.append_target_id = $append_target_id;

  this.width  = parseFloat(width);
  this.height = parseFloat(height);
  this.origin = {
    x: parseFloat(origin.x),
    y: parseFloat(origin.y)
  };
  this.drawScale  = parseFloat(drawScale);
  this.preCor = null;
  this.index  = 0;
  this.onRenderMarkOnGraph = onRenderMarkOnGraph;
  this.zoom = 100;
  this.theta = isNaN(parseFloat(theta)) ? 0 : parseFloat(theta);
  this.isMarkable = false;

  // D3 オブジェクトキャッシュ用
  this.d3ObjectsMap = {};

  // D3.js
  this.d3 = require('../lib/d3.min.js');
  // jQuery
  this.$ = require('../lib/jquery-3.1.0.min.js');
  // path を生成するためのジェネレータの設定
  this.line = this.d3.svg.line()
    .x(function(d) {return d.x;})
    .y(function(d) {return d.y;})
    .interpolate("cardinal");

  // グラフのツールチップ
  this.toolTip = this.d3.select("."+this.append_target_id)
    .append("div")
    .attr("class", "map-chart-tooltip");

  // スケールの初期化
  this.xScale = this.d3.scale.linear()
    .range([0, this.width]);
  this.yScale = this.d3.scale.linear()
    .range([this.height, 0]);

  // グラフドラッグ時の処理
  var self = this;
  this.translateHandler = function() {
    var x = 0;
    var y = 0;
    var str = self.d3.select(this).attr("transform");
    if (str != null) {
      var translate = str.substring(str.indexOf("(")+1, str.indexOf(")")).split(",");
      x = parseInt(translate[0]);
      y = parseInt(translate[1]);
    }
    var deg = self.d3.transform(self.d3ObjectsMap.svg.attr("transform")).rotate;

    x += self.d3.event.dx;
    y += self.d3.event.dy;
    self.d3ObjectsMap.svg.attr("transform", function(d,i){
      return "translate(" + [ x, y ] + ")rotate(" + deg + "," + self.origin.x + "," + self.origin.y + ")";
    });
  };
  this.rotateHandler = function() {
    var x = 0;
    var y = 0;
    var str = self.d3.select(this).attr("transform");
    if (str != null) {
      var translate = str.substring(str.indexOf("(")+1, str.indexOf(")")).split(",");
      x = parseInt(translate[0]);
      y = parseInt(translate[1]);
    }
    var deg = self.d3.transform(self.d3ObjectsMap.svg.attr("transform")).rotate;

    var pre_rad = Math.atan2(self.d3.event.x+self.d3.event.dx - (self.origin.x + x), self.d3.event.y+self.d3.event.dy - (self.origin.y + y));
    var rad = Math.atan2(self.d3.event.x - (self.origin.x + x), self.d3.event.y - (self.origin.y + y));
    deg += ( (rad - pre_rad) * 180 / Math.PI );

    self.d3ObjectsMap.svg.attr("transform", function(d,i){
      return "translate(" + [ x, y ] + ")rotate(" + deg + "," + self.origin.x + "," + self.origin.y + ")";
    });
  };
  this.dragHandler = this.d3.behavior.drag()
      .on("drag", this.translateHandler);
  this.nextDragBehavior = "rotate";
};

Map.prototype.init = function () {
  if ( this.d3.select("svg.map-chart-svg").empty() == false ) {
    this.d3.select("svg.map-chart-svg").remove();
  }

  this.d3.select("."+this.append_target_id)
    .append("svg")
    .attr('class', 'map-chart-svg')
    .attr("width", this.width)
    .attr("height", this.height)
    .append("g");
  var svg = this.d3.select("svg.map-chart-svg>g");

  // ドラッグの挙動を切り替えるためのボタンを配置
  var self = this;
  this.d3.select("."+this.append_target_id)
    .append("div")
    .attr("id", "map-chart-dragbehavior-button")
    .attr("fill","blue")
    .on("mousedown", function() {
      if ( self.d3.event.button == 0 ) {
        switch ( self.nextDragBehavior ) {
        case "rotate":
          self.dragHandler = self.d3.behavior.drag()
            .on("drag", self.rotateHandler);
          self.d3ObjectsMap.svg.call(self.dragHandler);
          self.d3ObjectsMap.svg.attr("class", "map-chart-dragbehavior-rotate");
          self.$(this).attr("class", "map-chart-dragbehavior-rotate");
          self.nextDragBehavior = "translate";
          break;
        case "translate":
          self.dragHandler = self.d3.behavior.drag()
            .on("drag", self.translateHandler);
          self.d3ObjectsMap.svg.call(self.dragHandler);
          self.d3ObjectsMap.svg.attr("class", "map-chart-dragbehavior-translate");
          self.$(this).attr("class", "map-chart-dragbehavior-translate");
          self.nextDragBehavior = "rotate";
          break;
        }
      }
    })
    .append("img");
  this.d3.select("."+this.append_target_id)
    .append("div")
    .attr("id", "map-chart-dragbehavior-reset-button")
    .on("mousedown", function() {
      if ( self.d3.event.button == 0 ) {
        self.d3ObjectsMap.svg.attr("transform", function(d,i){
          return "translate(" + [ 0, 0 ] + ")rotate(" + 0 + "," + self.origin.x + "," + self.origin.y + ")";
        });
      }
    })
    .text("RESET");

  // TODO: 原点 = スタート地点で良いか？
  this.preCor = {
    x: this.origin.x,
    y: this.origin.y
  };

  this.index = 0;

  this.$("div#map-chart-dragbehavior-button")
    .attr("class", "map-chart-dragbehavior-translate");
  svg.attr("class", "map-chart-dragbehavior-translate");

  this.d3ObjectsMap = {
    svg : svg,
    s : this.d3.select("svg.map-chart-svg")
  };
};

/**
 * 複数回に分けてマップを描画する
 * この関数を呼び出す前に，必ず init 関数を呼び出し初期化を行わなければならない．
 * また，描画を開始する原点を setOrigin で事前に設定しておくこと
 * 引数として座標を与えると，前回与えた座標から今回与えた座標までの線分を描画する．
 *
 * @param coordinate 次の座標({x:<number>,y:<number>})
 * @param clock      ログデータを一意に識別可能なのは実質的には clock である
 *                   したがって，他のデータとの紐付けを行いたい場合には clock も同時に渡す
 */
Map.prototype.render = function ( coordinate ) {
  var adjustedCor = {
    // [機体内での座標] -> x軸: ↑, y軸: ←
    // [画像を描画するときの座標]-> x軸: →, y軸: ↓
    // [機体内での座標]を[描画するときの座標]に変換して代入する
    x: parseFloat(coordinate.y) * -1,
    y: parseFloat(coordinate.x) * -1
  };

  // [機体内での座標]での単位: cm
  // [画像を描画するときの座標]での単位: px
  // スケールに合わせる([cm] -> [px])
  if ( ! isNaN(this.drawScale) ) {
    adjustedCor.x *= this.drawScale;
    adjustedCor.y *= this.drawScale;
  }

  // 原点に合わせる
  adjustedCor.x += this.origin.x;
  adjustedCor.y += this.origin.y;

  // 回転させる
  adjustedCor = rotateCoordiante(adjustedCor, this.theta, this.origin);

  if ( this.preCor == null ) {
    this.preCor = adjustedCor;
    this.index++;
    return;
  }

  this.d3ObjectsMap.svg
    // 線を描画
    .append("path")
    .datum([ this.preCor, adjustedCor ])
    .attr("class", "line")
    .attr("d", this.line);
  var self = this;
  this.d3ObjectsMap.svg
    // 円を描画
    .append("circle")
    .attr("index", this.index)
    .attr("r", 4)
    .attr("cx", adjustedCor.x)
    .attr("cy", adjustedCor.y)
    .attr("fill","rgb(54, 128, 183)")
    .on("mouseover", function() { // マウスオーバー時にツールチップを表示
      var svg_x = 0;
      var svg_y = 0;
      var str = self.d3ObjectsMap.svg.attr("transform");
      if (str != null) {
        var translate = str.substring(str.indexOf("(")+1, str.indexOf(")")).split(",");
        svg_x = parseInt(translate[0]);
        svg_y = parseInt(translate[1]);
      }
      var svg_deg = self.d3.transform(self.d3ObjectsMap.svg.attr("transform")).rotate;
      var x = (adjustedCor.x) * self.zoom/100 + svg_x;
      var y = (adjustedCor.y-23) * self.zoom/100 + svg_y;
      var origin = {
        x: self.origin.x * self.zoom/100 + svg_x,
        y: (self.origin.y-23) * self.zoom/100 + svg_y
      };
      var cor = rotateCoordiante({x:x,y:y}, svg_deg, origin);
      self.toolTip
        .style("left", cor.x + 3 + "px" )
        .style("top", cor.y - 2 + "px")
        .style("visibility","visible")
        .text( parseInt(coordinate.x*10)  + ", " + parseInt(coordinate.y*10) );

      // フォーカスを色で表す
      if ( self.d3ObjectsMap.preSelectedValue != undefined
           && self.d3ObjectsMap.preSelectedValue.is(self.$(this))) {
        // 選択されいてる場合
        self.$(this).attr("fill", "rgb(149, 27, 3)");
      } else {
        // 選択されていない場合
        self.$(this).attr("fill", "rgb(5, 52, 98)");
      }
    })
    .on("mouseout", function(d) { // マウスアウトするとツールチップを非表示
      self.toolTip.style("visibility","hidden");

      // フォーカスを色で表す
      if ( self.d3ObjectsMap.preSelectedValue != undefined
           && self.d3ObjectsMap.preSelectedValue.is(self.$(this))) {
        // 選択されている場合
        self.$(this).attr("fill", "rgb(236, 51, 35)");
      } else {
        // 選択されていない場合
        self.$(this).attr("fill", "rgb(54, 128, 183)");
      }
    })
    .on("mousedown", function() {
      // 右クリックの時は動作を止める
      if (this.d3.event.button === 2) {
        this.d3.event.stopImmediatePropagation();
      }
    }.bind(this))
    .on("contextmenu", function (d, i) {
      // 右クリック時の処理
      self.d3.event.preventDefault();

      if ( ! self.isMarkable ) { return; }

      var index = self.$(this)[0].attributes.index.value;

      // マークの描画
      // マップ上で直接マークする場合にはマウスカーソルがマーク対象に重なっている
      // はずなので、isFocused は true にする
      self.onRenderMark( index, true );
      if ( self.onRenderMarkOnGraph != undefined ) {
        // マーク描画時のイベントハンドラの実行
        // マップ以外(全グラフ)に、マップ上のどの値がマークされたか通知する
        self.onRenderMarkOnGraph( index );
      }
    });

  this.d3ObjectsMap.svg.call(this.dragHandler);

  this.preCor = adjustedCor;
  this.index++;
};

/**
 * マークを描画する
 * マークはグラフ/マップ上の特定の値を選択すると、その選択状態が全グラフ/マップ
 * 上で共有される機能。
 * グラフ/マップ上のデータはその index で一意に識別されるため、index を指定する。
 * また、マップの場合、マウスオーバーしているかそうでないかによってマーク時の色
 * が異なるため、その状態を明示的に指定する必要がある。
 *
 * @param index     マーク対象のデータの index
 * @param isFocused マーク対象にマウスオーバーしているかどうか
 */
Map.prototype.onRenderMark = function ( index, isFocused ) {
  var c = this.$("circle[index='"+index+"']");

  // 既に選択済みのものがあれば選択を外す
  if ( this.d3ObjectsMap.preSelectedValue != undefined ) {
    this.d3ObjectsMap.preSelectedValue.attr("fill", "rgb(54, 128, 183)");
  }

  if ( isFocused ) {
    c.attr("fill", "rgb(149, 27, 3)");
  } else {
    c.attr("fill", "rgb(236, 51, 35)");
  }

  // キャッシュ
  this.d3ObjectsMap.preSelectedValue = c;
};

Map.prototype.enableMark = function () {
  this.isMarkable = true;
};

Map.prototype.disableMark = function () {
  this.isMarkable = false;
};

/**
 * 1まとまりのデータを Map として描画する
 *
 * @param data 座標({x:<number>,y:<number>})の配列
 */
Map.prototype.renderFromData = function ( data ) {
  this.init();

  this.d3ObjectsMap.svg.selectAll("path")
    .data( data )
    .enter()
    .append("path")
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("d", this.diagonal);
};

/**
 * マップを拡大縮小する
 *
 * @param scale 拡大縮小の倍率 (0 ~ 100)
 */
Map.prototype.scale = function ( value ) {
  this.zoom = value;
  this.d3ObjectsMap.s
    .style("zoom" , value+"%");
};

/**
 * 座標の回転移動の一次変換を行う関数
 *
 * @param cor    回転対称の座標 { x: <number>, y: <number> }
 * @param theta  回転角度
 * @param origin 回転の起点
 */
function rotateCoordiante ( cor, theta, origin ) {
  // rad に変換
  theta = theta * (Math.PI / 180);
  return {
    x: (cor.x - origin.x) * Math.cos(theta) - (cor.y - origin.y) * Math.sin(theta) + origin.x,
    y: (cor.x - origin.x) * Math.sin(theta) + (cor.y - origin.y) * Math.cos(theta) + origin.y
  };
};

module.exports = Map;
