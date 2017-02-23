/**
 * モデル
 * アプリケーションのデータを管理する
 */

function model( win ) {
  this.data = {
    app: {
      logFileName   : '',
      logFileFolder : '',
      deviceMap     : []
    },
    setting: {
      image_path   : '',
      image_scale  : '',
      start_point  : '',
      draw_scale   : '',
      draw_rotate  : '',
      original_image_size : ''
    }
  };
  this.win = win;

  this.ipc = require('electron').ipcMain;
  this.ipc.on('updateState', this.onUpdateState.bind(this));
  this.ipc.on('getState', this.onGetState.bind(this));
}

/**
 * アプリケーションの状態を更新する
 *
 * key に対応するプロパティの値の更新と，更新の通知を行う
 */
model.prototype.onUpdateState = function ( event, arg ) {
  this.data[arg.doc][arg.key] = arg.value;
  this.win.webContents.send('updatedState');
};

/**
 * アプリケーションの状態を取得する
 *
 * WARGNING: sendSync で呼び出すことで値を取得できる
 *           例)
 *           var result = ipc.sendSync('getState', { 'doc': <doc>, 'key': <key> });
 */
model.prototype.onGetState = function ( event, arg ) {
  event.returnValue = this.data[arg.doc][arg.key];
};

module.exports = model;
