var http = require('http'),
    director = require('director'),
    url = require('url'),
    util = require('util'),
    querystring = require('querystring'),
    request = require('request'),
    CREDS = require('config').creds,
    static = require('node-static');
var file = new(static.Server)('.');

var host = 'localhost',
    port = 8080,
    API_KEY = process.env.API_KEY,
    API_SECRET = process.env.API_SECRET;

var baseUrl = "http://api.parsely.com/v2";
//var baseUrl = "http://localhost:8084/v2";
//

function getSecret(apikey) {
  var secret = "";
  for (var i in CREDS) {
    key = CREDS[i].apikey;
    if (apikey == key) {
      secret = CREDS[i].secret;
    }
  }
  return secret;
}

function combine(obj1, obj2) {
  var obj3 =  {};
  for (var i in obj1) {obj3[i] = obj1[i]};
  for (var i in obj2) {obj3[i] = obj2[i]};
  return obj3;
}

function apiCallback(err, res, body, that, jQuery) {
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
}

function analytics(type,dThis) {
  var query = url.parse(dThis.req.url,true).query;

  // Clean off jQuery callback stuff
  // Don't want to pass that to parsely API.
  var jQuery =  {
    callback: query.callback,
    _: query._
  }
  delete query.callback;
  delete query._;

  // Lookup secret by apikey in config/default.json
  var creds = {
    apikey: query.apikey,
    secret: getSecret(query.apikey)
  }

  // Remove credentials from query object
  delete query.apikey;
  delete query.secret; //placeholder secret sent by client

  // Combine full credentails and remaining query parameters
  var qs =  combine(creds,query);

  // Assemble URI for API request.
  var apiUrl = baseUrl + '/analytics/' + type;
  var options = { url: apiUrl, qs: qs};
  var that = dThis;
  console.log('request options: ');
  console.log(options);
  //Make request
  request(options,function(err,res,body) {
    apiCallback(err,res,body,that,jQuery);
  });
}

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

  // Lookup secret by apikey in config/default.json
  var creds = {
    apikey: query.apikey,
    secret: getSecret(query.apikey)
  }

  // Remove credentials from query object
  delete query.apikey;
  delete query.secret; //placeholder secret sent by client

  // Combine full credentails and remaining query parameters
  var qs =  combine(creds,query);

  // Assemble URI for API request.
  var apiUrl = baseUrl + '/analytics/' + type;
  var options = { url: apiUrl, qs: qs};
  var that = this;
  console.log('request options: ');
  console.log(options);
  //Make request
  request(options,function(err,res,body) {
    apiCallback(err,res,body,that,jQuery);
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

  // Remove credentials from query object
  delete query.apikey;
  delete query.secret; //placeholder secret sent by client

  // Combine full credentails and remaining query parameters
  var qs =  combine(creds,query);

  // Assemble URI for API request.
  var apiUrl = baseUrl + '/analytics/' + type;
  var options = { url: apiUrl, qs: qs};
  var that = this;
  console.log('request options: ');
  console.log(options);
  //Make request
  request(options,function(err,res,body) {
    apiCallback(err,res,body,that,jQuery)
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
console.log(util.inspect(CREDS));
console.log(CREDS[0].apikey);
console.log(CREDS[0].secret);
