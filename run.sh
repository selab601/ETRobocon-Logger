#!/bin/sh
if [ -z $1 ]; then
    echo "引数に /dev/tty.[名前]SerialPortProfile を指定してください"
else
    echo "終了するには Ctrl-C を押すか Command-Q で終了してください"
    node_modules/electron-prebuilt/dist/Electron.app/Contents/MacOS/Electron . $1
fi
