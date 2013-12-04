var http = require('http');
var static = require('node-static');
var file = new(static.Server)('.');

var host = 'localhost';
var port = 8080;
var API_KEY = process.env.API_KEY;
var API_SECRET = process.env.API_SECRET;
// Create HTTP server
var serv = http.createServer(function (req, res) {
  console.log('HTTP request');
  req.addListener('end', function () {
    // Serve files!
    file.serve(req, res);
  }).resume();
}).listen(port,host);
console.log('Server running at http://'+host+':'+port);
console.log('API KEY: '+API_KEY);
console.log('API SECRET: '+API_SECRET);
