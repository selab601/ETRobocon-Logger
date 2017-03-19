/**
 * モデル
 * アプリケーションのデータを管理する
 */

function model( win ) {
  this.data = {
    app: {
      logFileName   : '',
      logFileFolder : '',
      deviceMap     : [],
      save_setting  : ''
    },
    setting: {
      // connect
      default_log_directory_path: '',
      // map
      image_path          : '',
      image_scale         : '',
      image_original_size : '',
      start_point         : '',
      draw_scale          : '',
      draw_rotate         : ''
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

model.prototype.getLogSettings = function () {
  return {
    logFileName   : this.data.app.logFileName,
    logFileFolder : this.data.app.logFileFolder
  };
};

model.prototype.getSettings = function () {
  return this.data.setting;
};

module.exports = model;
