var http = require('http'),
    director = require('director'),
    url = require('url'),
    querystring = require('querystring'),
    request = require('request'),
    static = require('node-static');
var file = new(static.Server)('.');

var host = 'localhost',
    port = 8080,
    API_KEY = process.env.API_KEY,
    API_SECRET = process.env.API_SECRET;

var baseUrl = "http://api.parsely.com/v2";

function analytics() {
  this.res.writeHead(200, {'Content-Type': 'text/plain' });
  var query = url.parse(this.req.url,true).query;
  delete query.callback;
  delete query._;
  var qs = querystring.stringify(query);  
  var options = { uri: baseUrl, qs: qs};
  request(options,function(err,res,body) {
    that = this;
    if (err) {
      that.res.end('Error - Derp threshold breach');
      console.log('request callback error');
    } else {
      that.res.end(JSON.stringify(body));
    }
  });
}

// define a routing table.
var router = new director.http.Router({
  '/v2/analytics': {
    get: analytics
  }
});

// Create HTTP server
var serv = http.createServer(function (req, res) {
  console.log('HTTP request: req.method:  '+ req.method);
  console.log('HTTP request: req.url:  '+ req.url);
  console.log('HTTP request: req.body: '+ req.body);
  var path = url.parse(req.url,true).pathname;
  console.log('HTTP request: path: '+ path);
  req.addListener('end', function () {
    // Serve files!
    if (path != '/v2/analytics') {
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
