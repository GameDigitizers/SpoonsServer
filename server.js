'use strict';
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

// var chromecast = null;

var active_games = {}; // <game_id>: <GameFsm object>
var socket_to_game = {}; // <socket_id>: <GameFsm object>

router.on('i_am_chromecast', function (socket, args, next) {
  var msg = args[1];
  console.log(chalk.green('New chromecast'));

  if (msg && msg.game_id) {

  } else {
    // This is a new game
    game = new GameFsm();
    console.log("Made a new game with id", chalk.cyan.bold(game.id()));
    active_games[game.id()] = game;

    socket.emit('game-id', {id: game.id()});

    game.new_cast(socket);
  }

  // By not calling next(), the event is consumed.
});

router.on('join-game', function (socket, args, next) {
  console.log(chalk.green.bold("join-game"), args);

  var msg = args[1];

  if (msg && msg.game_id) {
    console.log("A client wants to join " + msg.game_id);

    if (_.has(active_games, msg.game_id)) {
      socket_to_game[socket.id] = active_games[msg.game_id];
      active_games[msg.game_id].new_player(socket);
    } else {
      console.error("TODO: tell client there's no such game");
    }
  }

  // By not calling next(), the event is consumed.
});

router.on('*', function (socket, args, next) {
  console.log(chalk.green.bold("Routered"), args);

  if (_.has(socket_to_game, socket.id)) {
    socket_to_game[socket.id].handle_message(socket.id, args[0], args[1]);
  }

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
