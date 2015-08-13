var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var _ =   require('lodash');
var router = require('socket.io-events')();

var GameFsm = require('./gameFsm').GameFsm;

var chalk = require('chalk');
chalk.enabled = true;

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

var chromecast = null;

var GameManager = (function () {
  var activeGames = {}; // <gameId>: <GameFsm object>
  var socketToGame = {}; // <socket_id>: <GameFsm object>
  
  function handleMessage (args) {
    if (_.has(socketToGame, args.socketId)) {
      socketToGame[args.socketId].handleMessage(args);
    } else {
      console.error('WTF?');
    }
  }

  function startGame (args) {
    var game = null;

    if (_.has(activeGames, args.msg.gameId)) {
      console.log("A client wants to join " + args.msg.gameId);

      game = activeGames[args.msg.gameId];
    } else {
      // This is a new game
      game = new GameFsm(args.msg.gameId);
      console.log("Made a new game with id", chalk.cyan.bold(game.id()));
      activeGames[game.id()] = game;
    }

    socketToGame[args.socket.id] = activeGames[args.msg.gameId];
    
    if (args.type === 'cast') {
      game.newCast(args.socket);
    } else {
      game.newPlayer(args.socket);
    }
  }

  return {
    handleMessage: handleMessage,
    startGame: startGame,
  };
})();


router.on('i_am_chromecast', function (socket, args, next) {
  console.log(chalk.green('New chromecast'));

  GameManager.startGame({
    msg: args[1],
    socket: socket,
    type: 'cast',
  });
  // By not calling next(), the event is consumed.
});

router.on('join-game', function (socket, args, next) {
  console.log(chalk.green.bold("join-game"), args);

  GameManager.startGame({
    msg: args[1],
    socket: socket,
    type: 'player',
  });

  // By not calling next(), the event is consumed.
});

router.on('*', function (socket, args, next) {
  console.log(chalk.green.bold("Routered"), args);
  GameManager.handleMessage({
    socketId: socket.id,
    type: args[0],
    msg: args[1],
  });

  next();
});

io.use(router);

// In case paths start conflicting
// app.use('/static', express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/receiver'));
app.use(express.static(__dirname + '/client'));
app.use(express.static(__dirname + '/sender'));

http.listen(3339, function(){
  console.log('listening on *:3339');
});
