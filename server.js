var http = require('http');
var static = require('node-static');
var file = new(static.Server)('.');

// Create HTTP server
var serv = http.createServer(function (req, res) {
  console.log('HTTP Connection');
  req.addListener('end', function () {
    // Serve files!
    file.serve(req, res);
  }).resume();
}).listen(8080);
console.log('Server running at http://localhost:8080');
