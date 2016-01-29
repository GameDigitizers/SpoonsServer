angular.module('spoons')
  .service('GameService', function (socket) {
    const ANON_NAME = 'Spoons!Player';
    var _playerName = 'Spoons!Player';
    this.setPlayerName = function (name) {
      if (this.playerName != ANON_NAME) {
        socket.emit('player-name', name);
        this.playerName = name;
      } else {
        console.error('you cannot set it!!!!');
      }
    };
    
    var _gameName = 'SPOONS!FUNTIME';
    this.gameName = function (name) {
      if (arguments.length > 0) {
        _gameName = name;
      } else {
        return _gameName;
      }
    };
  });