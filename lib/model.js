/**
 * モデル
 * アプリケーションのデータを管理する
 */

function model( win ) {
  this.stateMap = {
    id            : 'logger',
    logFileName   : undefined,
    logFileFolder : undefined,
    deviceMap     : [],
    setting       : undefined
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
  this.stateMap[arg.key] = arg.value;
  this.win.webContents.send('updatedState');
};

/**
 * アプリケーションの状態を取得する
 *
 * WARGNING: sendSync で呼び出すことで値を取得できる
 *           例)
 *           var result = ipc.sendSync('getState', 'key');
 */
model.prototype.onGetState = function ( event, arg ) {
  event.returnValue = this.stateMap[arg];
};

module.exports = model;
