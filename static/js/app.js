var geonews = angular.module('geonews', ['ui.router']);

geonews.config(function($httpProvider, $stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise("/home");
     $stateProvider
        .state('home', {
            url: '/home',
            templateUrl: 'partials/home.html'
        })
        .state('entity',{
            url: '/entity/:id',
            templateUrl: 'partials/entity.html'
        });
});