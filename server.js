var http = require('http'),
    director = require('director'),
    url = require('url'),
    util = require('util'),
    querystring = require('querystring'),
    request = require('request'),
    CREDS = require('config').creds,
    static = require('node-static');
var file = new(static.Server)('.');
var argv = require('yargs')
    .usage('start a Parse.ly API shim on a specified port.\nUsage: $0')
    .example('$0 -p 8080', 'start the server on port 8080')
    .describe('p', 'port')
    .default('p', '8080')
    .argv

var host = 'localhost',
    port = argv.p,
    API_KEY = process.env.API_KEY,
    API_SECRET = process.env.API_SECRET;

var baseUrl = "http://api.parsely.com/v2";

function getSecret(apikey) {
  return API_SECRET;
}

function combine(obj1, obj2) {
  var obj3 =  {};
  for (var i in obj1) {obj3[i] = obj1[i]};
  for (var i in obj2) {obj3[i] = obj2[i]};
  return obj3;
}

// return results to requestor (browser).
function apiCallback(err, res, body, that, jQuery) {
  if (err) {
    that.res.writeHead(500, {'Content-Type': 'text/plain' });
    that.res.end('Error');
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
      console.log(body);
    }
  } else {
    console.log('API RESPONSE ERROR');
    that.res.end(body);
    console.log(body);
  }
}

function shares(type,dThis) {
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

// Pass API call from web client along to parsely API server.
function analytics(type,dThis) {
  var query = url.parse(dThis.req.url,true).query;

  console.log('analytics query: ', util.inspect(query,false,2,true));
  // Clean off jQuery callback stuff
  // Don't want to pass that to parsely API.
  var jQuery =  {
    callback: query.callback,
    _: query._
  }
  console.log('analytics jQuery: ', util.inspect(jQuery,false,2,true));
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

// TODO having a function here for each second level URL value 
// [posts, sections, tags, authors] might be an anti-pattern.
function analyticsPosts() {
  var type = 'posts';
  analytics(type,this);
}

function analyticsSections() {
  var type = 'sections';
  analytics(type,this);
}

function analyticsTags() {
  var type = 'tags';
  analytics(type,this);
}

function analyticsAuthors() {
  console.log('analytics authors');
  var type = 'authors';
  analytics(type,this);
}

function analyticsAuthorDetail(that, author) {
  console.log('analytics author detail');
  author = author.replace('-','%20');
  var type = 'author/' + author + '/detail';
  analytics(type,that);
}

function sharesPosts() {
  var type = 'posts';
  shares(type,this);
}

function staticServe() {
  file.serve(this.req, this.res);
}

// define a routing table.
var router = new director.http.Router({
  '/v2': {
    '/analytics': {
      '/posts': {
        get: analyticsPosts
      },
      '/sections': {
        get: analyticsSections
      },
      '/tags': {
        get: analyticsTags
      },
      '/authors': {
        get: analyticsAuthors
      },
      // author is for the detail section
      '/author': {
        '/:author': {
          '/detail' : {
            get: function(author) {
              console.log('author/:author/detail ' + author);
              analyticsAuthorDetail(this,author);
            }
          }
        }
      },
    },
    '/shares': {
      '/posts': {
        get: sharesPosts
      }
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
    router.dispatch(req, res, function(err) {
      if (err) {
        res.writeHead(404);
        res.end()
      }
    });
  }).resume();
});

// Serve static files.
// For everything that's doesnt match the routing table.
router.get(/.*/, staticServe);

serv.listen(port,host);
console.log('Server running at http://'+host+':'+port);
