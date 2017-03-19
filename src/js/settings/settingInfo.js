// ファイル選択のためのモジュール
const remote = require('electron').remote;
const Dialog = remote.dialog;

function SettingInfo () {
  // 静的プロパティ
  this.configMap = {
    main_html : (function () {
      /*
        <div id="settings-info">
          <div class="settings-title first">Info</div>
          <div class="settings-form first">
            <input type="checkbox" id="settings-info-savable-form-checkbox">
            <label for="settings-info-savable-form-checkbox">設定をアプリ内で常に保持する</label>
          </div>
          <div class="settings-form">
            <div class="settings-form-title">Import :</div>
            <div class="settings-form-button settings-form-import-button">
              <img src="resources/import_icon.png">
            </div>
          </div>
          <div class="settings-form">
            <div class="settings-form-title">Export :</div>
            <div class="settings-form-button settings-form-export-button">
              <img src="resources/export_icon.png">
            </div>
          </div>
        </div>
      */}).toString().replace(/(\n)/g, '').split('*')[1]
  };
  // 動的プロパティ
  this.stateMap = {
    $append_target : undefined
  };
  // jQuery オブジェクトのキャッシュ用
  this.jqueryMap = {};
  // main プロセスとの通信用モジュール
  this.ipc = require('electron').ipcRenderer;
};


/******** イベントハンドラ ********/

SettingInfo.prototype.onCheck = function ( event ) {
  this.ipc.send('updateState', { doc: 'app', key: 'save_setting', value: event.currentTarget.checked });
};

SettingInfo.prototype.onImport = function ( event ) {
  Dialog.showOpenDialog(null, {
    properties: ['openFile'],
    title: 'インポートする設定ファイルの選択',
    defaultPath: '.'
  }, function(files){
    this.ipc.send( 'loadSetting', files[0] );
  }.bind(this));
};

SettingInfo.prototype.onExport = function ( event ) {
  Dialog.showSaveDialog(null, {
    title: 'エクスポートする設定ファイルの名前',
    defaultPath: '.',
    filters: [
      {name: 'Setting file', extensions: ['json']}
    ]
  }, function( path ){
    this.ipc.send( 'exportSetting', path );
  }.bind(this));
};

/**********************************/


SettingInfo.prototype.load = function ( save_setting ) {
  if ( save_setting == '' ) {
    save_setting = false;
  }

  this.jqueryMap.$checkbox.prop('checked', save_setting);
};


/**
 * jQuery オブジェクトをキャッシュする
 *
 * この機能モジュール内で使用する jQuery オブジェクトをキャッシュしておく
 * これを行うことで，目的の DOM を取得するためにいちいち id や class で検索する
 * 手間が省ける上に，パフォーマンスが向上する．
 */
SettingInfo.prototype.setJqueryMap = function () {
  var $append_target = this.stateMap.$append_target;
  this.jqueryMap = {
    $append_target : $append_target,
    $import_button : $append_target.find(".settings-form-import-button"),
    $export_button : $append_target.find(".settings-form-export-button"),
    $checkbox      : $append_target.find("#settings-info-savable-form-checkbox")
  };
};

/**
 * 機能モジュールの初期化
 */
SettingInfo.prototype.init = function ( $append_target ) {
  // この機能モジュールの DOM 要素をターゲットに追加
  this.stateMap.$append_target = $append_target;
  $append_target.append( this.configMap.main_html );
  // jQuery オブジェクトをキャッシュ
  this.setJqueryMap();

  // イベントハンドラの登録
  this.jqueryMap.$import_button.bind( "click", this.onImport.bind(this) );
  this.jqueryMap.$export_button.bind( "click", this.onExport.bind(this) );
  this.jqueryMap.$checkbox.bind( "change", this.onCheck.bind(this) );
};

/**
 * 機能モジュールの削除
 *
 * 追加した DOM 要素を削除し，動的プロパティを初期化する
 */
SettingInfo.prototype.remove = function () {
  // DOM 要素の削除
  if ( Object.keys(this.jqueryMap).length != 0 ) {
    this.stateMap.$append_target.find("#settings-info").remove();
    this.jqueryMap = {};
  }

  // 動的プロパティの初期化
  this.stateMap = {
    $append_target : undefined
  };
};

module.exports = SettingInfo;
