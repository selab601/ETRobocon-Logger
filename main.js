'use strinct';

// main プロセス側の IPC 用モジュール
const ipcMain = require('electron').ipcMain;
// シリアル通信用モジュール
const SerialPort = require('serialport');
// アプリケーションのライフサイクル管理のためのモジュール
const app = require('app');
// ブラウザウインドを生成するためのモジュール
const BrowserWindow = require('browser-window');

// メインウインドウをグローバル変数として保持しておく
// これがないと，JSのGCにウインドウを殺されてしまう
var mainWindow;

// 起準備動時の処理
app.on('ready', createWindow);

// 終了時の処理
app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 起動時の処理
app.on('activate', function() {
  if (mainWindow === null) {
    createWindow();
  }
});

// メインウインドウの生成
function createWindow() {
  mainWindow = new BrowserWindow({width: 1024, height: 600});
  mainWindow.loadURL(`file://${__dirname}/view/index.html`);

  // ウインドウが閉じられた場合の処理
  mainWindow.on('closed', function() {
    mainWindow = null;
  });

  connectEV3(mainWindow);
}

// EV3 と通信し，情報を取得する
function connectEV3 (mainWindow) {
  // ポートの設定
  // TODO: 対象デバイスをハードコーディングしているので，外部から設定できるようにする
  var port = new SerialPort.SerialPort("/dev/tty.HIYOKO-SerialPortProfile", {
    baudrate: 115200,
    parser: SerialPort.parsers.readline("\n")
  });

  // EV3 との通信 & Renderer プロセスへの送信
  // Renderer プロセスで JavaScript の実行が完了されていな場合，
  // うまくいかないらしい．これを防ぐために `did-finish-load`
  // イベントにコールバックを登録している
  // 参考: http://qiita.com/Misumi_Rize/items/dde76dbf89abee13991c#webcontentssend
  mainWindow.webContents.on('did-finish-load', function () {
    port.on('data', function(data) {
      mainWindow.webContents.send('serial', data);
    });
  });
}
