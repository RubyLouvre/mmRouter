var express = require('express');
var app = express();
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
  res.sendfile('index.html');
});
app.get('/aaa', function(req, res){
  res.sendfile('aaa.html');
});
app.get('/bbb', function(req, res){
  res.sendfile('bbb.html');
});
app.get('/ccc', function(req, res){
  res.sendfile('ccc.html');
});
app.get('/ddd', function(req, res){
  res.sendfile('ddd.html');
});
app.get('/eee', function(req, res){
  res.sendfile('eee.html');
});
app.listen(3000);