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
  this.file = require('fs'),
  this.save_setting_path = "setting.json";

  this.ipc = require('electron').ipcMain;
  this.ipc.on('updateState', this.onUpdateState.bind(this));
  this.ipc.on('getState', this.onGetState.bind(this));
  this.ipc.on('loadSetting', this.loadSetting.bind(this));
  this.ipc.on('exportSetting', this.exportSetting.bind(this));

  this.loadSetting();
}

/**
 * アプリケーションの状態を更新する
 *
 * key に対応するプロパティの値の更新と，更新の通知を行う
 */
model.prototype.onUpdateState = function ( event, arg ) {
  this.data[arg.doc][arg.key] = arg.value;
  this.win.webContents.send('updatedState');

  if ( arg.key == "default_log_directory_path" ) {
    this.data.app.logFileFolder = arg.value;
  }

  // 設定を保存する
  if ( this.data.app.save_setting ) {
    this.file.writeFileSync( this.save_setting_path, JSON.stringify( this.data ), 'utf8' );
  }
};

model.prototype.onDeleteSettings = function () {
  if ( this.file.existsSync( this.save_setting_path ) ) {
    this.file.unlinkSync( this.save_setting_path );
  }
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

model.prototype.loadSetting = function ( event, setting_path ) {
  var path = undefined;
  if ( setting_path != undefined ) {
    path = setting_path;
  } else {
    path = this.save_setting_path;
  }

  if ( this.file.existsSync( path ) ) {
    var settings = JSON.parse( this.file.readFileSync( this.save_setting_path ) );
    this.data = settings;

    if ( this.data.app.logFileFolder != this.data.setting.default_log_directory_path ) {
      this.data.app.logFileFolder = this.data.setting.default_log_directory_path;
    }
  }
};

model.prototype.exportSetting = function ( event, path ) {
  this.file.writeFileSync( path, JSON.stringify( this.data ), 'utf8' );
};


module.exports = model;
