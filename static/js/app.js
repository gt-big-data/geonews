var geonews = angular.module('geonews', ['ui.router']);

geonews.controller('EntityController', EntityController);
geonews.controller('TwoEntityController', TwoEntityController);
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
        .state('twoentity',{
            url: '/entity/:id/:first/:second',
            templateUrl: 'partials/twoentity.html',
            controller: 'TwoEntityController',
            controllerAs: 'Twoentity'
        });
});

EntityController.$inject = ['$state', '$http'];
function EntityController($state, $http) {
    this.name = $state.params.name;

    $http.get('/articles/' +$state.params.id).then(responseHandler.bind(this));

    function responseHandler(response) {
        this.data = response.data;
    }
}

TwoEntityController.$inject = ['$state', '$http'];
function TwoEntityController($state, $http) {
    this.first = $state.params.first;
    this.second = $state.params.second;
}