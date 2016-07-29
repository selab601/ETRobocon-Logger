google.charts.load('current', {'packages':['gauge', 'corechart']});
google.charts.setOnLoadCallback(drawChart);

var gaugeChart;
var areaChart;
var scatterChart;
function drawChart(){
    gaugeChart = new GaugeChart();
    areaChart = new AreaChart('Title', 'conut', 'Brightness');
    scatterChart = new ScatterChart('ScatterChart', 'x', 'y');
}

// ------ Class GaugeChart ----
var GaugeChart = function(){
    this.data = google.visualization.arrayToDataTable([
            ['Label', 'Value'],
            ['L PWM', 0],
            ['R PWM', 0],
            ['Brightness', 0],
            ['Gyro', 0]
    ]);

    this.options = {
width: 600, height: 160,
       redFrom: 90, redTo: 100,
       yellowFrom:75, yellowTo: 90,
       minorTicks: 5
    };

    this.element = document.createElement('div');
    document.getElementsByTagName("body").item(0).appendChild(this.element);
    this.chart = new google.visualization.Gauge(this.element);
}

GaugeChart.prototype.drawChart = function(){
    this.chart.draw(this.data, this.options);
}

GaugeChart.prototype.setValue = function(number, value){
    this.data.setValue(number, 1, value);
    this.drawChart();
}
// ------ end of Class GaugeChart ----


// ------ Class AreaChart ----
var AreaChart = function(graphTitle, xName, yName){
    this.data = new google.visualization.DataTable();
    this.data.addColumn('number', xName);
    this.data.addColumn('number', yName);

    this.options = {
title: graphTitle,
       hAxis: {title: xName,  titleTextStyle: {color: '#333'}},
       vAxis: {title: yName },
    };

    this.element = document.createElement('div');
    document.getElementsByTagName("body").item(0).appendChild(this.element);
    this.chart = new google.visualization.AreaChart(this.element);
}

AreaChart.prototype.drawChart = function(){
    this.chart.draw(this.data, this.options);
}

// ------ end of Class AreaChart ----

// ------ Class ScatterChart ----
var ScatterChart = function(graphTitle, xName, yName){
    this.data = new google.visualization.DataTable();
    this.data.addColumn('number', xName);
    this.data.addColumn('number', yName);

    this.options = {
title: graphTitle,
       hAxis: {title: xName },
       vAxis: {title: yName },
       legend: 'none'
    };
    this.element = document.createElement('div');
    document.getElementsByTagName("body").item(0).appendChild(this.element);
    this.chart = new google.visualization.ScatterChart(this.element);
}

ScatterChart.prototype.drawChart = function(){
    this.chart.draw(this.data, this.options);
}
// ------ end of Class ScatterChart ----
