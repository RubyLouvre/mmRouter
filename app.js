var express = require('express');
var app = express();
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
    res.sendfile('index.html');
});

"aaa,bbb,ccc,eee,default".replace(/\w+/g, function(method) {
    app.get("/" + method + "", function(req, res) {
        if (req.xhr) {
            res.sendfile(method + '.html');
        } else {
            res.sendfile('index.html');
        }
    });
})


app.get("/ddd/:ddd?", function(req, res) {
    if (req.xhr) {
        res.sendfile("ddd.html");
    } else {
        res.sendfile('index.html');
    }
});


app.listen(3000);
console.log("please open http://localhost:3000/")