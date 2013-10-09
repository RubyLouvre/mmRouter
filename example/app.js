var express = require('express');
var app = express();
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
    res.sendfile('index.html');
});
app.get("/tmpl.html", function(req, res) {
    //  console.log("tmpl.html")
    if (req.xhr) {
        res.sendfile('tmpl.html');
    }
})
//《----处理HTML5的刷新情况

app.get('/mvvm/:path', function(req, res) {
    var file = req.params.path
    if (file.split("/").pop().indexOf(".") === -1) {
        res.sendfile('index.html');
    } else if (file == "tmpl.html") {
        res.sendfile('tmpl.html');
    } else {
        res.sendfile(__dirname + "/public/" + file);
    }

});

//处理HTML5的刷新情况----》
app.get('/aaa', function(req, res) {
    res.sendfile('aaa.html');
});
app.get('/bbb', function(req, res) {
    res.sendfile('bbb.html');
});
app.get('/ccc', function(req, res) {
    res.sendfile('ccc.html');
});
app.get('/ddd', function(req, res) {
    res.sendfile('ddd.html');
});
app.get('/eee', function(req, res) {
    res.sendfile('eee.html');
});
app.listen(3000);
console.log("3000")