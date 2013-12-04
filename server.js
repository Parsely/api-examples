var http = require('http'),
    director = require('director'),
    static = require('node-static');
var file = new(static.Server)('.');

var host = 'localhost',
    port = 8080,
    API_KEY = process.env.API_KEY,
    API_SECRET = process.env.API_SECRET;

function hitParsely() {
  this.res.writeHead(200, {'Content-Type': 'text/plain' });
  this.res.end('hitting parsely');
}

// define a routing table.
var router = new director.http.Router({
  '/data': {
    get: hitParsely
  }
});

// Create HTTP server
var serv = http.createServer(function (req, res) {
  console.log('HTTP request: '+ req.url);
  req.addListener('end', function () {
    // Serve files!
    if (req.url != '/data') {
      file.serve(req, res);
    } else {
      router.dispatch(req, res, function(err) {
        if (err) {
          res.writeHead(404);
          res.end()
        }
      });
    }
  }).resume();
}).listen(port,host);
console.log('Server running at http://'+host+':'+port);
console.log('API KEY: '+API_KEY);
console.log('API SECRET: '+API_SECRET);
