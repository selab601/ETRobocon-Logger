var ipcRenderer = require('electron').ipcRenderer;

// Main プロセスから EV3 の情報を受信
ipcRenderer.on('serial', (ev, message) => {
  console.log(message);
});
