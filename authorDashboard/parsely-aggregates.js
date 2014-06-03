var parselyAggregates = (function () {
  var parselyAggregates = {};

  parselyAggregates.authorDaily = function(key, secret, author, handler) {
    console.log('author Daily ' + author);
    author = author.replace('-','%20');
    author = author.replace(' ','%20');

    // MAGIC MUMBER: days for which to calculate aggregate hits.
    // Calculate array of dates in YYYY-MM-DD format.
    numberOfDays = 10;
    tasks = [];
    var now = moment();
    for (i = 0; i < numberOfDays; i++) {
      day = now.format('YYYY-MM-DD');
      now.subtract('days',1);
      tasks.push(buildAPICall(key, secret, baseUrl, day, author));
    }
    console.log('daysInPeriod' + tasks);
    async.parallel(tasks,handler);
  }

  // Returns a function which fits the async.parallel pattern:
  // a function which takes one argument, which is a callback.
  // the return function executes this callback as its final action.
  function buildAPICall(key, secret, baseUrl, date, author) {
    return function(callback) {
      var url = baseUrl + '/analytics/author/' + author + '/detail';
      // MAGIC NUMBER: number of posts to consider for daily totals: 20.
      params = { apikey: key, secret: secret,
                 period_start: date, period_end: date, limit: 20};
      // TODO watch out!  deal with blank jQuery object on
      // those calls for the aggregate points.
      //TODO: use $.getJSON instead of request.
      $.getJSON(url, params, function( data, stat) {
        aggregateApiCallback(stat, data, date, callback);
      });
    }
  }

  function aggregateApiCallback(err, res, body, date, callback) {
    if (err) {
       console.log('AGGREGATE API REQUEST ERROR');
       // TODO handle error
    } else if (res.statusCode == 200 ) {
      if (body.code > 200) {
        console.log('AGGREGATE API RESPONSE NOT OK');
       // TODO handle error
      } else {
       // TODO handle OK
        console.log('AGGREGATE API RESPONSE OK');
        data = JSON.parse(body);
        // Sum up _hits from each element
        totalHits = 0;
        for (i in data.data) {
          totalHits += data.data[i]._hits;
        }
        result = {date: date, hits: totalHits};
        callback(err, result)
      }
    } else {
      console.log('AGGREGATE API RESPONSE ERROR');
      console.log(body);
    }
  }
 
  return parselyAggregates;
}());
