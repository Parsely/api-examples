var roundup = angular.module('roundup', ['ui.bootstrap']);

roundup.config(function($httpProvider, $interpolateProvider, $routeProvider) {
    // Ensure that Django can pick up the requests as XHR for request.is_ajax()
    $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

    // Ensure no conflicts with Jinja2's templates (can also use Jinja's raw)
    $interpolateProvider.startSymbol('{$');
    $interpolateProvider.endSymbol('$}');
});

roundup.controller('PostsController', function($scope, $http) {
    $scope.shouldPoll = true;
    $scope.timeBetweenPolls = 5000;
    $scope.firstLoadComplete = false;
    $scope.refreshing = false;
    $scope.posts = [];

    $scope.poll = function() {
        if (debug)
            console.info('Fetching top posts');

        $scope.refreshing = true;

        $http.get('/top_posts', {params: {limit: 50}}).success(function(posts) {
            if (debug)
                console.info(posts);
            // Selectively delete posts so that our CSS transitions don't wipe
            // out all <li>s
            for (var i = 0; i < posts.length; i++) {
                if (i >= $scope.posts.length) {
                    $scope.posts.push(posts[i]);
                    continue;
                }
                var currentURL = $scope.posts[i].url || $scope.posts[i].link,
                    newURL = posts[i].url || posts[i].link;

                if (currentURL != newURL)
                    $scope.posts[i] = posts[i];
            }

            $scope.firstLoadComplete = true;
            $scope.refreshing = false;

            if ($scope.shouldPoll)
                window.setTimeout($scope.poll, $scope.timeBetweenPolls);

        });

    };

    $scope.numberWithCommas = function(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    $scope.getPopoverText = function(post) {
        return "Views in last 6 hours: " + $scope.numberWithCommas(post['_hits']);
    };

    $scope.encodeURIComponent = encodeURIComponent;

    $scope.poll();
});