var geonews = angular.module('geonews', ['ui.router']);

geonews.controller('EntityController', EntityController);
geonews.controller('EntityArticleController', EntityArticleController);
geonews.controller('EntityDataController', EntityDataController);

geonews.directive('entityKeywordGraph', EntityKeywordGraph);

geonews.config(function($httpProvider, $stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise("/home");
     $stateProvider
        .state('home', {
            url: '/home',
            templateUrl: 'partials/home.html'
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
});

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
    this.name = $state.params.name;
    this.loading = true;

    $http.get('/articles/' +$state.params.id, {cache: true})
        .then(responseHandler.bind(this));

    function responseHandler(response) {
        this.loading = false;
        this.data = response.data;
    }
}

EntityKeywordGraph.$inject = ['$http'];
function EntityKeywordGraph() {
    var directive = {
        scope: {
            id: '=',
            name: '=',
        },
        restrict: 'AEC',
        templateUrl: 'partials/entity.keywordgraph.html'
    }

    directive.controller = function($scope, $http) {
        console.log($scope);

        $http.get('/keywords/' + $scope.id).then(handler);


        function handler(response) {
            var margin = {top: 20, right: 20, bottom: 70, left: 40};
            var width = 600 - margin.left - margin.right;
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
              .attr("height", function(d) { return height - y(d.count); });
        }
    };

    directive.link = function($scope, $element, $attr) {

    };

    return directive;
}