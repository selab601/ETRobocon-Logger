/**
 * モデル
 * アプリケーションのデータを管理する
 */

const validator = new (require('jsonschema').Validator);

function model( win ) {
  this.data = {
    app: {
      logFileName   : '',
      logFileFolder : '',
      deviceMap     : [],
      save_setting  : false
    },
    setting: {
      // connect
      default_log_directory_path: '',
      // map
      image_path          : '',
      image_scale         : 100,
      image_original_size : {},
      start_point         : {},
      draw_scale          : 0,
      draw_rotate         : 0
    }
  };
  this.win = win;
  this.file = require('fs'),
  this.save_setting_path = "setting.json";

  this.ipc = require('electron').ipcMain;
  this.ipc.on('updateState', this.onUpdateState.bind(this));
  this.ipc.on('getState', this.onGetState.bind(this));
  this.ipc.on('importSetting', this.onImportSetting.bind(this));
  this.ipc.on('exportSetting', this.onExportSetting.bind(this));

  try {
    this.loadSetting( this.save_setting_path );
  } catch ( e ) {
    // デフォルトパスにある設定ファイルが不正な形式である場合
    // TODO: 削除してしまう？
    console.log(e);
  }
}

/**
 * アプリケーションの状態を更新する
 *
 * key に対応するプロパティの値の更新と，更新の通知を行う
 */
model.prototype.onUpdateState = function ( event, arg ) {
  this.data[arg.doc][arg.key] = arg.value;
  this.win.webContents.send('updatedState');

  // デフォルトパスが設定されたなら、現在のログファイルパスをそれに合わせる
  if ( arg.key == "default_log_directory_path" ) {
    this.data.app.logFileFolder = arg.value;
  }

  // 設定を保存する
  if ( this.data.app.save_setting ) {
    this.file.writeFileSync( this.save_setting_path, JSON.stringify( this.data ), 'utf8' );
  } else {
    this.onDeleteSettings();
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

model.prototype.loadSetting = function ( target_path ) {
  if ( target_path == undefined ) {
    target_path = this.save_setting_path;
  }

  if ( this.file.existsSync( target_path ) ) {
    var setting = undefined;
    var schema = undefined;

    try {
      settings = JSON.parse( this.file.readFileSync( target_path ) );
      schema = JSON.parse( this.file.readFileSync( "lib/model.json" ) );
    } catch ( e ) {
      throw Error("Invalid json format");
    }

    // 値の検証
    var result = validator.validate( settings, schema );
    if ( result.errors.length > 0 ) {
      throw new Error("Invalid json format: <br/>" + result.errors.join("<br/>"));
    }

    // 代入
    this.data.setting = settings.setting;
    // デフォルトのログファイルの出力先パスを現在の出力先パスに設定する
    this.data.app.logFileFolder = settings.setting.default_log_directory_path;
    // 設定をロードした場合には、自動的にデータのセーブフラグを入にする
    this.data.app.save_setting = true;
  }
};

model.prototype.onImportSetting = function ( event, arg ) {
  try {
    var path = arg;
    this.loadSetting( path );
  } catch ( e ) {
    event.sender.send('failedToImportSetting', {
      title: "Error",
      body: e.message
    });
  }

  event.sender.send('importedSetting', {});
};

model.prototype.onExportSetting = function ( event, path ) {
  this.file.writeFileSync( path, JSON.stringify( this.data ), 'utf8' );
};


module.exports = model;
