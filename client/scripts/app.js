angular.module('spoons', [
  'ngRoute',
  'ui.bootstrap',
  'btford.socket-io',
  'ngAnimate'
  ])
  .factory('socket', function(socketFactory) {
    var myIoSocket = io.connect('/');

    var theSocket = socketFactory({
        ioSocket: myIoSocket
    });

    return theSocket;
  })
  .config(function($routeProvider, $locationProvider) {
    $locationProvider.html5Mode({
      enabled: true,
      requireBase: false
    });

    $routeProvider
      .when('/', {
        controller: 'MainCtrl',
        templateUrl: '/main.html'
      })
      .when('/:gameName', {
        controller: 'LobbyCtrl',
        templateUrl: '/lobby.html'
      })
      .when('/:gameName/game', {
        controller: 'GameCtrl',
        templateUrl: '/game.html'
      })
      .when('/:gameName/avatars', {
        controller: 'AvatarsCtrl',
        templateUrl: '/avatars.html'
      })
      .otherwise({ 
        redirectTo: '/' 
      });
  });