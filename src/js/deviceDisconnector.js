/**
 * Bluetooth デバイスとの接続を解除する
 * 接続解除時に登録された callback 関数を実行する
 */

function deviceDisconnector () {
  // 静的プロパティ
  this.configMap = {
    main_html : (function () {
      /*
        <div id="device-disconnector-button">DISCONNECT</div>
      */}).toString().replace(/(\n)/g, '').split('*')[1]
  };
  // 動的プロパティ
  this.stateMap = {
    $append_target : undefined,
    logFileName    : undefined
  };
  // jQuery オブジェクトのキャッシュ用
  this.jqueryMap = {};
  // Bluetooth デバイスとの接続解除時に実行する callback 関数
  this.callback = undefined;
  // ユーザへ通知を行うコールバック関数
  this.messenger = undefined;
  // main プロセスとの通信用モジュール
  this.ipc = require('electron').ipcRenderer;
};


/***** イベントハンドラ *****/

/**
 * 接続解除ボタン押下時に呼び出されるイベントハンドラ
 */
deviceDisconnector.prototype.onDisconnectDevice = function () {
  this.ipc.send('disconnectDevice', this.stateMap.logFileName);
  this.jqueryMap.$disconnect_btn.addClass('disabled');
};

/**
 * 接続解除成功時に呼び出されるイベントハンドラ
 *
 * main プロセスから接続解除のメッセージを受信したら実行する．
 * 登録されたコールバック関数を実行する．
 * TODO: ユーザにメッセージを表示する
 */
deviceDisconnector.prototype.onDisconnectDeviceComplete = function ( ev, message ) {
  // 保存先を表示するため，ダイアログの表示時間を少し長くする
  this.messenger( message.title, message.body, null, 10000 );
  this.callback();
};

/****************************/


/**
 * jQuery オブジェクトをキャッシュする
 *
 * この機能モジュール内で使用する jQuery オブジェクトをキャッシュしておく
 * これを行うことで，目的の DOM を取得するためにいちいち id や class で検索する
 * 手間が省ける上に，パフォーマンスが向上する．
 */
deviceDisconnector.prototype.setJqueryMap = function () {
  var $append_target = this.stateMap.$append_target;
  this.jqueryMap = {
    $append_target  : $append_target,
    $disconnect_btn : $append_target.find("#device-disconnector-button")
  };
};

/**
 * 機能モジュールの初期化
 */
deviceDisconnector.prototype.init = function ( $append_target, callback, messenger ) {
  // この機能モジュールの DOM 要素をターゲットに追加
  this.stateMap.$append_target = $append_target;
  $append_target.append( this.configMap.main_html );
  // jQuery オブジェクトをキャッシュ
  this.setJqueryMap();

  // ロギング結果を保存するログファイル名
  // 現状，main プロセス側は，最初は一時ファイルにデータを保存しているため，
  // これを指定したログファイル名にリネームする必要がある．
  this.stateMap.logFileName = this.ipc.sendSync('getState', { doc: 'app', key: 'logFileName' });
  // 接続解除成功時に実行されるコールバック関数
  this.callback = callback;
  // ユーザへの通知用コールバック関数
  this.messenger = messenger;

  // イベントハンドラを登録
  this.jqueryMap.$disconnect_btn.bind( 'click', this.onDisconnectDevice.bind(this));
  this.ipc.on('disconnectDeviceComplete', this.onDisconnectDeviceComplete.bind(this));
};

/**
 * 機能モジュールの削除
 *
 * 追加した DOM 要素を削除し，動的プロパティを初期化する
 * FIXME: 二重に remove を呼び出したときにエラーとなる
 */
deviceDisconnector.prototype.remove = function () {
  // DOM 要素削除
  if ( Object.keys(this.jqueryMap).length != 0 ) {
    this.jqueryMap.$disconnect_btn.remove();
    this.jqueryMap = {};
  }

  // イベントハンドラの削除
  this.ipc.removeAllListeners('disconnectDeviceComplete');

  // 動的プロパティ初期化
  this.stateMap = {
    $append_target : undefined,
    logFileName : undefined
  };
  this.callback = undefined;
  this.messenger = undefined;
};

module.exports = deviceDisconnector;
