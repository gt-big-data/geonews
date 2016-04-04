var geonews = angular.module('geonews', ['ui.router']);

geonews.controller('EntityController', EntityController);
geonews.controller('EntityArticleController', EntityArticleController);
geonews.controller('EntityDataController', EntityDataController);
geonews.controller('HeatMapController', HeatMapController);

geonews.directive('entityKeywordGraph', EntityKeywordGraph);
geonews.directive('infiniteScroll', InfiniteScroll);
geonews.directive('loadingIndicator', LoadingIndicator);
geonews.directive('timeSeriesGraph', TimeSeriesGraph);

geonews.service('MapManager', MapManager);

geonews.config(function($httpProvider, $stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise("/home");
     $stateProvider
        .state('home', {
            url: '/home',
            templateUrl: 'partials/home.html',
            controller: 'MapController',
        })
        .state('entity',{
            url: '/entity/:id/:name',
            templateUrl: 'partials/entity.html',
            controller: 'EntityController',
            controllerAs: 'Entity'
        })
          .state('entity.articles',{
              url: '/articles',
              templateUrl: 'partials/entity.articles.html',
              controller: 'EntityArticleController',
              controllerAs: 'EntityArticle'
          })
          .state('entity.data',{
              url: '/data',
              templateUrl: 'partials/entity.data.html',
              controller: 'EntityDataController',
              controllerAs: 'EntityData'
          })
        .state('heatmap', {
          url: '/heatmap',
          templateUrl: 'partials/heatmap.partial.html',
          controller: 'HeatMapController',
          controllerAs: 'HeatMap'
        })
});



HeatMapController.$inject = ['$state', '$http', '$interval', 'MapManager'];
function HeatMapController($state, $http, $interval,  MapManager) {
  var map = MapManager.getMap();
  var heatmaps = []
  var hour = 0;
  var heatmap = null;
  this.search = function() {
    var options = {
      cache: true,
      params: {
        hour: hour
      }
    }
    // $interval(function() {
      console.log(hour);
      $http.get('/heatmap/'+ this.query, options).then(function(response) {
        var data = response.data.map(function(i) {
          return {location: new google.maps.LatLng(i.lat, i.lng),
            weight: i.frequency * 5};
        });
        heatmap = new google.maps.visualization.HeatmapLayer({
          data: data
        });
        heatmaps.forEach(function(h) {
          h.setMap(null);
        });
        heatmap.setMap(map);
        heatmaps.push(heatmap);
      });
      hour++;
    // }, 3000, 5);

  };
}

function MapManager() {

  var service = {};
  // create a new google map and render it into the div with the id map


  var styles = [
        {
          featureType: "all",
          elementType: "labels",
          stylers: [
            { visibility: "off" }
          ]
        }
  ];



  service.getMap = function() {
    d3.select("#map").node().innerHTML = '';
    var map = new google.maps.Map(d3.select("#map").node(), {
      zoom: 2,
      center: new google.maps.LatLng(37.76487, 20.41948),
      mapTypeId: google.maps.MapTypeId.TERRAIN
    });
    map.setOptions({styles: styles});
    return map;
  }
  return service;
}

EntityController.$inject = ['$state', '$http'];
function EntityController($state, $http) {
    this.name = $state.params.name;
    this.id = $state.params.id;
}

EntityDataController.$inject = ['$state', '$http'];
function EntityDataController($state, $http) {
    this.name = $state.params.name;
    this.id = $state.params.id;
}

EntityArticleController.$inject = ['$state', '$http'];
function EntityArticleController($state, $http) {
    this.page = 1;
    this.name = $state.params.name;

    $http.get('/articles/' +$state.params.id, {cache: true,
      params: {page: this.page}}).then(responseHandler.bind(this));

    function responseHandler(response) {
        this.data = response.data;
        this.page++;
    }
}


function InfiniteScroll() {
  console.log('scroller');
  return function($scope, $element, $attr) {
    $element.bind('scroll', function() {
        console.log('scrolling');
    });
  }
}

LoadingIndicator.$inject = ['$http']
function LoadingIndicator($http) {
    return  {
        restrict: 'AE',
        templateUrl: 'partials/loading-indicator.html',

        link: function($scope, $element, $attrs) {
          $scope.isLoading = isLoading;
          $scope.$watch($scope.isLoading, toggle);

          function toggle(loading) {
            if (loading) {
              $element.show();
            }
            else {
              $element.hide();
            }
          }

          function isLoading() {
            return $http.pendingRequests.length > 0;
          }

        }
    }
}

TimeSeriesGraph.$inject = ['$http'];
function TimeSeriesGraph($http) {
  var directive = {
        scope: {
            id: '=',
            name: '=',
        },
        restrict: 'AEC',
        templateUrl: 'partials/entity.timeseriesgraph.html'
    };

  directive.link = function($scope, $element, $attrs) {
    $http.get('/timeseries/' + $scope.id).then(render);

    function render(response) {
      var data = response.data.map(function(d) {
        d.date = new Date(d._id);
        return d;
      });

      data.sort(function(a, b) {
        return a.date - b.date;
      });

      var margin = {top: 20, right: 20, bottom: 30, left: 50},
      width = $element.parent().width() - margin.left - margin.right,
      height = 300 - margin.top - margin.bottom;

      var formatDate = d3.time.format("%d-%b-%y");

      var x = d3.time.scale()
          .range([0, width]);

      var y = d3.scale.linear()
          .range([height, 0]);

      var xAxis = d3.svg.axis()
          .scale(x)
          .orient("bottom");

      var yAxis = d3.svg.axis()
          .scale(y)
          .orient("left");

      var line = d3.svg.line()
          .x(function(d) { return x(d.date); })
          .y(function(d) { return y(d.count); });

      var svg = d3.select("body").append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      x.domain(d3.extent(data, function(d) { return d.date; }));
      y.domain(d3.extent(data, function(d) { return d.count; }));

      svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

      svg.append("g")
          .attr("class", "y axis")
          .call(yAxis)
        .append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", ".71em")
          .style("text-anchor", "end")
          .text("Price ($)");

        svg.append("path")
          .datum(data)
          .attr("class", "line")
          .attr("d", line);


    }
  }
  return directive;
}

EntityKeywordGraph.$inject = ['$http'];
function EntityKeywordGraph($http) {
    var directive = {
        scope: {
            id: '=',
            name: '=',
        },
        restrict: 'AEC',
        templateUrl: 'partials/entity.keywordgraph.html'
    }

    directive.link = function($scope, $element, $attrs) {
        console.log($scope);

        $http.get('/keywords/' + $scope.id).then(handler);


        function handler(response) {
            var margin = {top: 20, right: 20, bottom: 70, left: 40};
            var width = $element.parent().width() - margin.left - margin.right;
            var height = 300 - margin.top - margin.bottom;

            var x = d3.scale.ordinal().rangeRoundBands([0, width]);
            var y = d3.scale.linear().range([height, 0]);

            var xAxis = d3.svg.axis()
                .scale(x)
                .tickValues(response.data.map(function(d) {d._id}))
                .orient("bottom");

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left")
                .ticks(10);

            var data = response.data;
            var svg = d3.select("#keyword-graph").append("svg")
                        .attr("width", width + margin.left + margin.right)
                        .attr("height", height + margin.top + margin.bottom)
                        .append("g")
                        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            var tip = d3.tip().attr('class', 'd3-tip').html(function(d) {
                return '<span>' + d._id +  ' ' + d.count + '</span>';
              });
            svg.call(tip);

            x.domain(data.map(function(d, i) { return i;}));
            y.domain([1, d3.max(data, function(d) { return d.count; })]);

            svg.append("g")
              .attr("class", "x axis")
              .attr("transform", "translate(0," + height + ")")
              .call(xAxis)
            .selectAll("text")
              .style("text-anchor", "end")
              .attr("dx", "-.8em")
              .attr("dy", "-.55em")
              .attr("transform", "rotate(-90)");


            svg.append("g")
              .attr("class", "y axis")
              .call(yAxis)
            .append("text")
              .attr("transform", "rotate(-90)")
              .attr("y", 6)
              .attr("dy", ".71em")
              .style("text-anchor", "end")
              .text("Count");

            svg.selectAll("bar")
              .data(data)
            .enter().append("rect")
              .style("fill", "steelblue")
              .attr("x", function(d, i) {
                return x(i);
               })
              .attr("width", 20)
              .attr("y", function(d) {
                return y(d.count);
             })
              .attr("height", function(d) { return height - y(d.count); })
              .on('mouseover', tip.show)
              .on('mouseout', tip.hide);
        }
    };

    return directive;
}