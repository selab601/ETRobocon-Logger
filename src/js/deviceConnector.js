/**
 * Bluetooth デバイスと接続する
 *
 * Bluetooth デバイスの検索，表示，選択，接続を行う．
 * 接続に成功した場合には，登録された callback を実行する．
 */

function deviceConnector () {
  // 静的プロパティ
  this.configMap = {
    main_html : (function () {
      /*
        <div id="device-connector-wrapper">
          <div id="device-connector">
            <div class="device-connector-header">
              Devices
            </div>
            <div class="device-connector-body">
              <ul id="device-connector-device-group">
                <!-- デバイスが追加されていく -->
              </ul>
            </div>
            <div id="device-connector-body-footer">
              <div id="device-connector-update-button">
              <img src="resources/update_icon.png">
              </div>
            </div>
            <div class="device-connector-footer">
              <div id="device-connector-connect-button">CONNECT</div>
            </div>
          </div>
        </div>
      */}).toString().replace(/(\n)/g, '').split('*')[1]
  };
  // 動的プロパティ
  this.stateMap = {
    $append_target          : undefined,
    deviceMap               : [],
    selected_device_address : undefined
  };
  // jQuery オブジェクトのキャッシュ用
  this.jqueryMap = {};
  // Bluetooth デバイスとの接続成功後に実行されるコールバック関数
  this.onConnectDeviceCompleted = undefined;
  // ユーザへ通知を行うコールバック関数
  this.onNotify = undefined;
  // main プロセスとの通信用モジュール
  this.ipc = require('electron').ipcRenderer;
  // jQuery
  this.$ = require('./lib/jquery-3.1.0.min.js');
};


/******* イベントハンドラ *******/

/**
 * Bluetooth デバイス一覧の更新ボタン押下時に呼び出されるイベントハンドラ
 *
 * main プロセス側に Bluetooth デバイスの検索を要求する．
 * また，更新中は更新ボタン，接続ボタンを押下できないようにする．
 */
deviceConnector.prototype.onUpdateDevices = function () {
  this.ipc.send('updateDevices');
  this.jqueryMap.$update_btn.addClass('disabled');
  this.jqueryMap.$connect_btn.addClass('disabled');
};

/**
 * Bluetooth デバイス一覧の取得が完了したときに呼び出されるイベントハンドラ
 *
 * main プロセス側で取得が完了した際に実行される
 */
deviceConnector.prototype.onUpdateDevicesComplete = function ( ev, message ) {
  this.onNotify( message.title, message.body );
  this.jqueryMap.$update_btn.removeClass('disabled');
  this.jqueryMap.$connect_btn.removeClass('disabled');
};

/**
 * Bluetooth デバイスを main プロセスから受信した際に呼び出されるイベントハンドラ
 *
 * 取得したデバイス情報でビューを更新する．この時，すでに追加されているデバイスは追加しない．
 * デバイスはアドレスで一意に識別する．
 */
deviceConnector.prototype.onFoundDevice = function ( ev, message ) {
  var device = message;

  // リストに追加済みであったなら追加しない
  for ( var i=0; i < this.stateMap.deviceMap.length; i++ ) {
    if ( this.stateMap.deviceMap[i].address === device.address ) { return; }
  }

  // プロパティに追加
  this.stateMap.deviceMap.push(device);
  // モデルに追加
  this.ipc.send('updateState', { doc: 'app', key: "deviceMap", value: this.stateMap.deviceMap } );
  // DOM 要素に追加
  this.jqueryMap.$device_group.append(
    this.$('<li>')
      .addClass("device-connector-device-name")
      .text(device.name)
      .bind( 'click', device, this.onSelectDevice.bind(this) ));
};

/**
 * Bluetooth デバイスが一覧から選択された際に呼び出されるイベントハンドラ
 *
 * 選択したデバイスのアドレスをプロパティに保存し，DOM 要素をハイライトする．
 */
deviceConnector.prototype.onSelectDevice = function ( event ) {
  // 既に別のデバイスが選択済みであったなら，選択を外す
  if ( this.jqueryMap.$selected_device != undefined ) {
    this.jqueryMap.$selected_device.removeClass("selected");
  }
  // プロパティに追加
  this.stateMap.selected_device_address = event.data.address;
  this.stateMap.selected_device = event.data;
  // DOM 要素に描画
  this.jqueryMap.$selected_device = this.$(event.target);
  this.jqueryMap.$selected_device.addClass("selected");
};

/**
 * 接続ボタン押下時に呼び出されるイベントハンドラ
 *
 * main プロセスに選択されたデバイスとの接続を要求する．
 * 接続のために，デバイスのアドレスも同時に送信する．
 * また，接続処理中は更新ボタン，接続ボタンを使用不可にする．
 */
deviceConnector.prototype.onConnectDevice = function ( event ) {
  if ( this.stateMap.selected_device_address === undefined ) { return; }
  this.ipc.send('connectDevice', this.stateMap.selected_device); // TODO
  this.jqueryMap.$update_btn.addClass('disabled');
  this.jqueryMap.$connect_btn.addClass('disabled');
};

/**
 * Bluetooth デバイスとの接続成功時に呼び出されるイベントハンドラ
 *
 * main プロセスから接続成功のメッセージを受信した場合に実行する．
 * 登録されたコールバック関数を実行する．
 */
deviceConnector.prototype.onConnectDeviceComplete = function ( ev, message ) {
  this.onNotify( message.title, message.body );
  this.onConnectDeviceCompleted();
};

/**
 * Bluetooth デバイスとの接続失敗時に呼び出されるイベントハンドラ
 *
 * TODO: メッセージをユーザに向けて表示
 */
deviceConnector.prototype.onConnectDeviceFailed = function ( ev, message ) {
  this.onNotify( message.title, message.body );
  this.jqueryMap.$update_btn.removeClass('disabled');
  this.jqueryMap.$connect_btn.removeClass('disabled');
};

/********************************/

/**
 * モデルを読み込み，DOM 要素のデバイス一覧を初期化する
 */
deviceConnector.prototype.loadDevices = function () {
  this.stateMap.deviceMap = this.ipc.sendSync('getState', { doc: 'app', key: 'deviceMap' });
  this.stateMap.deviceMap.forEach( function ( device ) {
    this.jqueryMap.$device_group.append(
      this.$('<li>')
        .addClass( "device-connector-device-name" )
        .text( device.name )
        .bind( 'click', device, this.onSelectDevice.bind(this) ));
  }.bind(this));
}

/**
 * jQuery オブジェクトをキャッシュする
 *
 * この機能モジュール内で使用する jQuery オブジェクトをキャッシュしておく
 * これを行うことで，目的の DOM を取得するためにいちいち id や class で検索する
 * 手間が省ける上に，パフォーマンスが向上する．
 */
deviceConnector.prototype.setJqueryMap = function () {
  var $append_target = this.stateMap.$append_target;
  this.jqueryMap = {
    $append_target  : $append_target,
    $device_group   : $append_target.find("#device-connector-device-group"),
    $update_btn     : $append_target.find("#device-connector-update-button"),
    $connect_btn    : $append_target.find("#device-connector-connect-button"),
    $slected_device : undefined
  };
};

/**
 * 機能モジュールの初期化
 */
deviceConnector.prototype.init = function ( $append_target, onConnectDeviceCompleted, onNotify ) {
  // この機能モジュールの DOM 要素をターゲットに追加
  this.stateMap.$append_target = $append_target;
  $append_target.append( this.configMap.main_html );
  // jQuery オブジェクトをキャッシュ
  this.setJqueryMap();

  // Bluetooth デバイスとの接続が完了したときに実行されるコールバック関数
  this.onConnectDeviceCompleted = onConnectDeviceCompleted;
  // メッセージ通知用のコールバック関数
  this.onNotify = onNotify;
  // デバイス群のロード
  this.loadDevices();

  /***** イベントハンドラを登録 *****/
  // DOM 要素へのユーザ操作に反応するイベントハンドラ
  this.jqueryMap.$update_btn.bind( 'click', this.onUpdateDevices.bind(this));
  this.jqueryMap.$connect_btn.bind( 'click', this.onConnectDevice.bind(this));
  // main プロセスからの通信に反応するイベントハンドラ
  this.ipc.on('updateDevicesComplete', this.onUpdateDevicesComplete.bind(this));
  this.ipc.on('foundDevice', this.onFoundDevice.bind(this));
  this.ipc.on('connectDeviceComplete', this.onConnectDeviceComplete.bind(this));
  this.ipc.on('connectDeviceFailed', this.onConnectDeviceFailed.bind(this));
};

/**
 * 機能モジュールの削除
 *
 * 追加した DOM 要素を削除し，動的プロパティを初期化する
 * FIXME: 二重に remove を呼び出したときにエラーとなる
 */
deviceConnector.prototype.remove = function () {
  // DOM 要素の削除
  if ( Object.keys(this.jqueryMap).length != 0 ) {
    this.stateMap.$append_target.find("#device-connector-wrapper").remove();
    this.jqueryMap = {};
  }

  // イベントハンドラの削除
  this.ipc.removeAllListeners('updateDevicesComplete');
  this.ipc.removeAllListeners('foundDevice');
  this.ipc.removeAllListeners('connectDeviceComplete');
  this.ipc.removeAllListeners('connectDeviceFailed');

  // 動的プロパティの初期化
  this.stateMap = {
    $append_target          : undefined,
    deviceMap               : [],
    selected_device_address : undefined,
    selected_device         : undefined
  };
  this.callback = undefined;
  this.onNotify = undefined;
};

module.exports = deviceConnector;
