var http = require('http'),
    director = require('director'),
    url = require('url'),
    util = require('util'),
    querystring = require('querystring'),
    request = require('request'),
    static = require('node-static');
var file = new(static.Server)('.');

var host = 'localhost',
    port = 8080,
    API_KEY = process.env.API_KEY,
    API_SECRET = process.env.API_SECRET;

var baseUrl = "http://api.parsely.com/v2";
//var baseUrl = "http://localhost:8084/v2";

function posts() {
  var type = 'posts';
  var query = url.parse(this.req.url,true).query;

  // Clean off jQuery callback stuff
  // Don't want to pass that to parsely API.
  var jQuery =  {
    callback: query.callback,
    _: query._
  }
  delete query.callback;
  delete query._;

  //hard coded single-secret
  //TODO: Change to lookup secret based on API key.
  var creds = {
    apikey: query.apikey,
    secret: API_SECRET
  }
  delete query.apikey;
  delete query.secret; //placeholder secret sent by client
  //credsQs = querystring.stringify(creds);
  //var qs = credsQs + '&' + querystring.stringify(query);  
  var qs =  {};
  for (var i in creds) {qs[i] = creds[i]};
  for (var i in query) {qs[i] = query[i]};

  // Assemble URI for API request.
  // TODO: posts is hardcoded.
  var apiUrl = baseUrl + '/analytics/' + type;
  var options = { url: apiUrl, qs: qs};
  var that = this;
  console.log('request options: ');
  console.log(options);
  //Make request
  request(options,function(err,res,body) {
    if (err) {
      that.res.writeHead(500, {'Content-Type': 'text/plain' });
      that.res.end('Error - Derp threshold breach');
      console.log('request callback error');
    } else if (res.statusCode == 200 ) {
      console.log('API RESPONSE');
      if (body.code > 200) {
        that.res.writeHead(body.code, {'Content-Type': 'text/plain' });
        console.log('API RESPONSE FAIL');
      } else {
        that.res.writeHead(200, {'Content-Type': 'application/json' });
        console.log('API RESPONSE SUCCESS');
        jQuerycallback = jQuery.callback + '([' + body + '])';
        that.res.end(jQuerycallback);
        //that.res.end(body);
        /*
        console.log('that:');
        console.log(util.inspect(that));
        console.log('that.res:');
        console.log(util.inspect(that.res));
        */
        console.log(body);
      }
    } else {
      console.log('API RESPONSE ERROR');
      that.res.end(body);
      console.log(body);
    }
  });
}

function authors() {
  var type = 'authors';
  var query = url.parse(this.req.url,true).query;

  // Clean off jQuery callback stuff
  // Don't want to pass that to parsely API.
  var jQuery =  {
    callback: query.callback,
    _: query._
  }
  delete query.callback;
  delete query._;

  //hard coded single-secret
  //TODO: Change to lookup secret based on API key.
  var creds = {
    apikey: query.apikey,
    secret: API_SECRET
  }
  delete query.apikey;
  delete query.secret; //placeholder secret sent by client
  //credsQs = querystring.stringify(creds);
  //var qs = credsQs + '&' + querystring.stringify(query);  
  var qs =  {};
  for (var i in creds) {qs[i] = creds[i]};
  for (var i in query) {qs[i] = query[i]};

  // Assemble URI for API request.
  // TODO: posts is hardcoded.
  var apiUrl = baseUrl + '/analytics/' + type;
  var options = { url: apiUrl, qs: qs};
  var that = this;
  console.log('request options: ');
  console.log(options);
  //Make request
  request(options,function(err,res,body) {
    if (err) {
      that.res.writeHead(500, {'Content-Type': 'text/plain' });
      that.res.end('Error - Derp threshold breach');
      console.log('request callback error');
    } else if (res.statusCode == 200 ) {
      console.log('API RESPONSE');
      if (body.code > 200) {
        that.res.writeHead(body.code, {'Content-Type': 'text/plain' });
        console.log('API RESPONSE FAIL');
      } else {
        that.res.writeHead(200, {'Content-Type': 'application/json' });
        console.log('API RESPONSE SUCCESS');
        jQuerycallback = jQuery.callback + '([' + body + '])';
        that.res.end(jQuerycallback);
        //that.res.end(body);
        /*
        console.log('that:');
        console.log(util.inspect(that));
        console.log('that.res:');
        console.log(util.inspect(that.res));
        */
        console.log(body);
      }
    } else {
      console.log('API RESPONSE ERROR');
      that.res.end(body);
      console.log(body);
    }
  });
}


// define a routing table.
var router = new director.http.Router({
  '/v2/analytics': {
    '/posts': {
      get: posts
    },
    '/authors': {
      get: authors
    }
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
    if (path != '/v2/analytics' && path != '/v2/analytics/posts') {
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
