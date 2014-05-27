var http = require('http'),
    director = require('director'),
    urllib = require('url'),
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

// TODO having a function here for each second level URL value 
// [posts, sections, tags, authors] might be an anti-pattern.
function analyticsPosts() {
  var query = urllib.parse(this.req.url,true).query;
  ParselyHandler('/analytics/posts',this, query);
}

function analyticsSections() {
  var query = urllib.parse(this.req.url,true).query;
  ParselyHandler('/analytics/sections',this, query);
}

function analyticsTags() {
  var query = urllib.parse(this.req.url,true).query;
  ParselyHandler('/analytics/tags',this, query);
}

function analyticsAuthors() {
  var query = urllib.parse(this.req.url,true).query;
  ParselyHandler('/analytics/authors',this, query);
}

function authorDaily(that, author) {
  console.log('author Daily ' + author);
  var query = urllib.parse(that.req.url,true).query;
  extract = getCredsAndjQuery(query);
  author = author.replace('-','%20');

  function HandleAsyncResults(err, results) {
    // Send results to browser
    jQueryCallback = extract.jQuery.callback 
                     + '([' + JSON.stringify(results) + '])';
    that.res.writeHead(200, {'Content-Type': 'application/json' });
    that.res.end(jQueryCallback);
  }

  // MAGIC MUMBER: days for which to calculate aggregate hits.
  // Calculate array of dates in YYYY-MM-DD format.
  numberOfDays = 10;
  tasks = [];
  var now = moment();
  for (i = 0; i < numberOfDays; i++) {
    day = now.format('YYYY-MM-DD');
    now.subtract('days',1);
    tasks.push(buildAPICall(extract.creds, baseUrl, day, author));
  }
  console.log('daysInPeriod', util.inspect(tasks,false,2,true));
  async.parallel(tasks,HandleAsyncResults);
}

function sharesPosts() {
  var type = 'posts';
  shares(type,this);
}

function analyticsAuthorDetail(that, author) {
  author = author.replace('-','%20');
  var endpoint = '/analytics/author/' + author + '/detail';
  var query = urllib.parse(this.req.url,true).query;
  ParselyHandler(endpoint,this, query);
}

// Pass API call from web client along to parsely API server.
function ParselyHandler(endpoint,that, query) {
  extract = getCredsAndjQuery(query);
  // Combine full credentails and remaining query parameters
  var qs =  combine(extract.creds,query);
  // Assemble URI for API request.
  var apiUrl = baseUrl + endpoint
  var options = { url: apiUrl, qs: qs};
  console.log('request options: ' + util.inspect(options,false,2,true));
  qstring = querystring.stringify(qs);
  console.log('API URL: ' + apiUrl + '?' + qstring);
  request(options,function(err, apiResponse, body) {
    browserApiCallback(err,apiResponse,body,that.res,extract.jQuery);
  });
}

// Returns a function which fits the async.parallel pattern:
// a function which takes one argument, which is a callback.
// the return function executes this callback as its final action.
function buildAPICall(creds, baseUrl, date, author) {
  return function(callback) {
    var url = baseUrl + '/analytics/author/' + author + '/detail';
    // MAGIC NUMBER: number of posts to consider for daily totals: 20.
    params = { apikey: creds.apikey, secret: creds.secret,
               period_start: date, period_end: date, limit: 20};
    // TODO watch out!  deal with blank jQuery object on 
    // those calls for the aggregate points.
    var options = {url: url, qs: params};
    console.log('request options: ' + util.inspect(options,false,2,true));
    qstring = querystring.stringify(params);
    console.log('API URL: ' + url + '?' + qstring);
    request(options, function( err, apiResponse, body) {
      aggregateApiCallback(err, apiResponse, body, date, callback);
    });
  }
}

function aggregateApiCallback(err, apiResponse, body, date, callback) {
  if (err) {
     console.log('AGGREGATE API REQUEST ERROR');
     // TODO handle error
  } else if (apiResponse.statusCode == 200 ) {
    if (body.code > 200) {
      console.log('AGGREGATE API RESPONSE NOT OK');
     // TODO handle error
    } else {
     // TODO handle OK
      console.log('AGGREGATE API RESPONSE OK');
      data = JSON.parse(body);
      //console.log(util.inspect(data, false, 2, true));
      //console.log(util.inspect(data[0], false, 2, true));
      // Sum up _hits from each element
      totalHits = 0;
      for (i in data.data) {
        //console.log(util.inspect(data.data[i], false, 2, true));
        totalHits += data.data[i]._hits;
      }
      result = {date: date, hits: totalHits};
      callback(err, result)
    }
  } else {
    console.log('AGGREGATE API RESPONSE ERROR');
    clientResponse.end(body);
    console.log(body);
  }
}

// return results to requestor (browser).
function browserApiCallback(err, apiResponse, body, clientResponse, jQuery) {
  if (err) {
     console.log('API REQUEST ERROR');
     clientResponse.writeHead(500, {'Content-Type': 'text/plain' });
     clientResponse.end('Error');
  } else if (apiResponse.statusCode == 200 ) {
    if (body.code > 200) {
      console.log('API RESPONSE NOT OK');
      clientResponse.writeHead(body.code, {'Content-Type': 'text/plain' });
      clientResponse.end();
    } else {
      console.log('API RESPONSE OK');
      clientResponse.writeHead(200, {'Content-Type': 'application/json' });
      jQueryCallback = jQuery.callback + '([' + body + '])';
      clientResponse.end(jQueryCallback);
      data = JSON.parse(body);
      console.log(util.inspect(data, false, 2, true));
    }
  } else {
    console.log('API RESPONSE ERROR');
    clientResponse.end(body);
    console.log(body);
  }
}

function getCreds(apikey) {
  // Lookup secret by apikey in config/default.json
  var creds = {
    apikey: apikey,
    secret: getSecret(apikey)
  }
  return creds;
}

function getCredsAndjQuery(query) {
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
  var path = urllib.parse(req.url,true).pathname;
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
