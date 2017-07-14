# ET Robocon Logger

[![MIT License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](LICENSE.txt)

[ETロボコン](http://www.etrobo.jp/) で使用するために開発したロガーです．
EV3 と Bluetooth 接続すると，機体の状態をリアルタイムで確認できます．
また，ログをファイルに保存し，後に参照することができます．

## 動作条件

ABI のバージョンが node / electron 間で異なるとエラーが生じる( issue #6 )。


- node: `v6.0`以上

## 実行方法(開発時)

nodeモジュールのインストール
```
npm install
```

node / electron 間のABIバージョンを合わせるためリビルドする
```
./node_modules/.bin/electron-rebuild
```

実行
```
./run.sh
```

## TODO

> [Home · selab601/ETRobocon-Logger Wiki](https://github.com/selab601/ETRobocon-Logger/wiki)
