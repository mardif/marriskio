'use strict';


// Declare app level module which depends on filters, and services
angular.module('myApp', [
  'ngRoute',
  'myApp.filters',
  'myApp.services',
  'myApp.directives',
  'myApp.controllers'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/myMatches', {templateUrl: 'partials/partial1.html', controller: 'MyMatchCtrl'});
  $routeProvider.when('/availableMatches', {templateUrl: 'partials/partial2.html', controller: 'AvailableMatchCtrl'});
  $routeProvider.when('/history', {templateUrl: 'partials/partial1.html', controller: 'HistoryCtl'});
  $routeProvider.otherwise({redirectTo: '/view1'});
}]);
