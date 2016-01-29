angular.module('spoons')
  .controller('MainCtrl', function ($scope, $location, GameService) {
    $scope.go = function () {
      $location.path($scope.gameName);
      // $window.location.href = '/'+$scope.gameName;
    };
  });