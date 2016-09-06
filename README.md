# ET2016 ロガー

ET2016 で使用する予定のロガーです．

## 準備

- 事項環境(開発時)
  - `node` : `v4.x`
  - `npm`  : `v3.9.3`

### node.js の準備

`nvm` なり `nodebrew` なりを使用して，好きなバージョンの `node.js` をインストールしよう．
やり方はググッてね．

### 依存パッケージのインストール

`package.js` に依存関係にあるモジュール群が記述されているので，それをインストールする．
以下のコマンドでOK．

``` shell
$ npm install
```


### Electron の起動

Electron というものを使用しています．
特に本アプリでは，古いバージョンの Electron が必要になります．
起動のためのバイナリは前項の `package.js` 内に記述されています．
`npm install` すると，`node_module` というディレクトリが生成され，その下に依存モジュール群がダウンロードされるので，そこからバイナリを起動する必要があります．

引数に`/dev/tty.[Name]SerialPortProfile`を指定してください.

パスは以下のようになります．

``` shell
$ node_modules/electron-prebuilt/dist/Electron.app/Contents/MacOS/Electron .  /dev.tty.[Name]SerialPortProfile
```

または、
``` shell
$ ./run.sh /dev.tty.[Name]SerialPortProfile
```

で実行できます．

起動手順については，次節を参照して下さい．

## 使い方

### 起動手順

1. EV3 の電源をつける
2. Mac から，システム環境設定 > Bluetooth を選択
3. 一覧から該当するデバイスを見つけ，ペアリングする
   - 一瞬失敗しても，待っていれば繋がることがある
4. EV3 において LoadApp > SD Card > selab と選択し，EV3 側のアプリを起動
5. EV3 の画面に `connecting ...` と表示されるまで待機
6. 表示されたら，Mac から本アプリを起動する( `./run.sh /dev.tty.[Name]SerialPortProfile`)
7. 接続に成功すると，EV3 から音がする

### 終了手順

特に無いです．しいて言うなら，EV3 か Mac 側のアプリを終了させる

### ログファイル

[ログファイルについて](./log/README.md)

## TODO

- 接続先デバイスを選択できるようにしたい
- システム環境設定からペアリングするのが面倒
- アプリの終了方法が雑なのでなんとかしたい
- `.app` ファイルにしたい
- Electron の簡単な解説をまとめておく
  - Main / Renderer プロセスについて
  - プロセス間の IPC (プロセス間通信) について
