angular.module('spoons')
  .controller('MainCtrl', function ($scope, $location, GameService) {
    $scope.gameNameSubmitted = false;
    $scope.go = function () {
      $scope.gameNameSubmitted = true;
      $location.path($scope.gameName);

      // $window.location.href = '/'+$scope.gameName;
    };
  });