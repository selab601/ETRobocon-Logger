function Map ( $append_target_id, width, height, origin, drawScale, onSelectData, theta ) {
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
  this.onSelectData = onSelectData;
  this.zoom = 100;
  this.theta = isNaN(parseFloat(theta)) ? 0 : parseFloat(theta);

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
  this.dragBehaviorFlag = true;
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
  this.d3.select("svg.map-chart-svg")
    .append("circle")
    .attr("r", 20)
    .attr("cx", 30)
    .attr("cy", 30)
    .attr("fill","blue")
    .on("mousedown", function() {
      if ( self.d3.event.button == 0 ) {
        if ( self.dragBehaviorFlag ) {
          self.d3ObjectsMap.svg.call(self.d3.behavior.drag()
                                     .on("drag", self.rotateHandler));
          self.$(this).attr("fill", "red");
          self.dragBehaviorFlag = false;
        } else {
          self.d3ObjectsMap.svg.call(self.d3.behavior.drag()
                                     .on("drag", self.translateHandler));
          self.$(this).attr("fill", "blue");
          self.dragBehaviorFlag = true;
        }
      }
    });

  // TODO: 原点 = スタート地点で良いか？
  this.preCor = {
    x: this.origin.x,
    y: this.origin.y
  };

  this.index = 0;

  this.d3ObjectsMap = { svg : svg };
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
    x: parseFloat(coordinate.x),
    // Y 軸の向きを 下 -> 上 にするために，-1 をかける
    y: parseFloat(coordinate.y) * -1
  };

  // スケールに合わせる
  if ( ! isNaN(this.drawScale) ) {
    adjustedCor.x /= this.drawScale;
    adjustedCor.y /= this.drawScale;
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
        .style("left", cor.x + "px" )
        .style("top", cor.y + "px")
        .style("visibility","visible")
        .text( parseInt(coordinate.x*10)  + ", " + parseInt(coordinate.y*10) );
    })
    .on("mouseout", function(d) { // マウスアウトするとツールチップを非表示
      self.toolTip.style("visibility","hidden");
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
      if ( self.onSelectData != undefined ) {
        // 既に選択済みのものがあれば選択を外す
        if ( self.d3ObjectsMap.preSelectedValue != undefined ) {
          self.d3ObjectsMap.preSelectedValue.attr("fill", "rgb(54, 128, 183)");
        }
        self.onSelectData(self.$(this)[0].attributes.index.value);
        self.$(this).attr("fill", "red");
        // キャッシュ
        self.d3ObjectsMap.preSelectedValue = $(this);
      }
    });

  this.d3ObjectsMap.svg.call(this.dragHandler);

  this.preCor = adjustedCor;
  this.index++;
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
  this.d3ObjectsMap.svg
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
