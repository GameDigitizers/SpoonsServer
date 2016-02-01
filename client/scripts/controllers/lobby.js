angular.module('spoons')
  .controller('LobbyCtrl', function ($scope, $location, GameService) {
    console.log('set game name to:?', $location.path().substring(1));
    GameService.gameName($location.path().substring(1));
    $scope.gameName = GameService.gameName();
    $scope.sendPlayerName = function () {
      GameService.setPlayerName($scope.playerName);
      $location.path(GameService.gameName() + '/avatars');
    };
  });