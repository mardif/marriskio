'use strict';

/* Controllers */

angular.module('account.controllers', [])	
  .controller('MyMatchCtrl', ['$scope', 'fakeMatchProvider', function($scope, fakeMatchProvider) {
  	$scope.users = fakeMatchProvider.getMatches();
  }])
  .controller('AvailableMatchCtrl', ['$scope', function($scope) {

  }])
  .controller('HistoryCtl', ['$scope', function($scope) {

  }]);
