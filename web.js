var express = require('express');
var fs = require('fs');

var infile = "index.html"
var app = express.createServer(express.logger());

app.get('/', function(request, response) {
  var buffer = fs.readFileSync(infile);
  //response.send('Hello World 2!');
  response.send(buffer.toString("utf-8"));
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
