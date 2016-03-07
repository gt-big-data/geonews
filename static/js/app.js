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

function EntityKeywordGraph() {
    var directive = {
        scope: {
            id: '=',
            name: '=',
        },
        restrict: 'AEC',
        templateUrl: 'partials/entity.keywordgraph.html'
    }

    directive.controller = function($scope) {

    };

    directive.link = function($scope, $element, $attr) {

    };

    return directive;
}