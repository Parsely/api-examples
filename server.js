var http = require('http'),
    director = require('director'),
    url = require('url'),
    util = require('util'),
    querystring = require('querystring'),
    request = require('request'),
    async = require('async'),
    moment = require('moment'),
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

function extractCredsAndjQuery(query) {
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
  return {creds: creds, jQuery: jQuery};
}

// Pass API call from web client along to parsely API server.
function ParselyHandler(endpoint,dThis) {
  var query = url.parse(dThis.req.url,true).query;

  extract = extractCredsAndjQuery(query);
  // Combine full credentails and remaining query parameters
  var qs =  combine(extract.creds,query);

  // Assemble URI for API request.
  var apiUrl = baseUrl + endpoint
  var options = { url: apiUrl, qs: qs};
  var that = dThis;
  console.log('request options: ');
  console.log(options);
  //Make request
  request(options,function(err,res,body) {
    apiCallback(err,res,body,that,extract.jQuery);
  });
}

// TODO having a function here for each second level URL value 
// [posts, sections, tags, authors] might be an anti-pattern.
function analyticsPosts() {
  ParselyHandler('/analytics/posts/',this);
}

function analyticsSections() {
  ParselyHandler('/analytics/sections',this);
}

function analyticsTags() {
  ParselyHandler('/analytics/tags',this);
}

function analyticsAuthors() {
  ParselyHandler('/analytics/authors',this);
}

function analyticsAuthorDetail(that, author) {
  author = author.replace('-','%20');
  var endpoint = '/analytics/author/' + author + '/detail';
  ParselyHandler(endpoint,this);
}

// Returns a function which fits the async.parallel pattern:
// a function which takes one argument, which is a callback.
// the return function executes this callback as its final action.
function buildAPICall(baseUrl, date, author) {
  return function(callback) {
    url = baseUrl + '/analytics/author/' + author + '/detail';
    // MAGIC NUMBER: number of posts to consider for daily totals: 20.
    params = { period_start: date, period_end: date, limit: 20};
  }
}

function authorDaily(that, author) {
  console.log('author Daily ' + author);
  author = author.replace('-','%20');
  // MAGIC MUMBER: days for which to calculate aggregate hits.
  // Calculate array of dates in YYYY-MM-DD format.
  numberOfDays = 10;
  daysInPeriod = [];
  var now = moment();
  for (i = 0; i < numberOfDays; i++) {
    daysInPeriod.push(now.format('YYYY-MM-DD'));
    now.subtract('days',1);
  }
  console.log('daysInPeriod', util.inspect(daysInPeriod,false,2,true));
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
  },
  '/v3': {
    '/aggregates' : {
      '/author' : {
        '/:author' : {
          '/daily' : {
            get : function (author) { 
               console.log('/v3/aggregates/author/' + author + '/daily');
               authorDaily(this, author);
              }
          }
        }
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
