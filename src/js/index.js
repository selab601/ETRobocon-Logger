require('date-utils');
var LogWriter = function(){
    this.date = new Date();
    this.formatted = this.date.toFormat("YYYY_MMDD_HH24MISS");
    this.fileName = 'log/' + this.formatted + '.csv';
    this.file = require('fs');

    // HTMLにファイル名を表示
    this.element = document.createElement('div');
    this.element.innerHTML = '<h2>Log File: ' + this.fileName  + '</h2>';
    document.getElementsByTagName("body").item(0).appendChild(this.element);
}

LogWriter.prototype.append = function(message){
    // ファイルに書き込む
    this.file.appendFile(this.fileName, message ,'utf8' );
}

var logWriter = new LogWriter();

var ipcRenderer = require('electron').ipcRenderer;
// Main プロセスから EV3 の情報を受信
ipcRenderer.on('serial', (ev, message) => {
        message += '\n';

        console.log(message);

        logWriter.append(message);

        var values = message.split(",");

        var clock = values[0] + 0;
        var brightness = values[1] + 0;
        var gyro = values[2] + 0;

        var leftCount = values[6];
        var rightCount = values[7];

        gaugeChart.setLeftCount(leftCount);
        gaugeChart.setRightCount(rightCount);

        gaugeChart.setValue(2, values[1]);
        gaugeChart.setValue(3, gyro + 50.0);


        // areaChart.data.addRows([ [Number(clock), Number(brightness)] ]);
        // areaChart.drawChart();
        });
