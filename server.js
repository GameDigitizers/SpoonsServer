var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var machina = require('machina');
var chance = new require('chance')();

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});



var Player = function (in_game, in_socket) {
  var socket = in_socket;
  var game = in_game;

  this.chooseAvatar = function () {
    socket.emit('choose-avatar', { avatars: [] });

    socket.on('avatar-choice', function (message) {
      game.handle('avatar-choice', message.avatar);
    });
  }

}

var chromecast = null;

var GameFsm = machina.Fsm.extend({
  initialize: function () {
    this.chromecasts = [];
    this.players = [];

    // this.game_id = chance.string({
    //   length:5,
    //   pool:"ABCDEFGHJKLMNPQRSTUVWXYZ123456789"
    // });
    this.game_id = "SPOON";
  },

  namespace: 'spoons',
  initialState: 'lobby',

  states: {
    lobby: {
      connection: function (socket) {
        player = new Player(this, socket);
        this.players.push(player);

        player.chooseAvatar(this.available_avatars);
      },

      'avatar-choice': function (avatar) {
        chromecast.newPlayer(avatar);
      }
    }
  },

  id: function () {
    return this.game_id;
  },

  new_cast: function (chromecast) {
    console.log("Just met a new chromecast", chromecast.id);
    this.chromecasts.push(chromecast);

    // this.handle('send-view')
  }
});

var active_games = {};

io.on('connection', function(socket){
  console.log('CONNECTED');
  
  socket.on('i_am_chromecast', function(msg){
    console.log("SOMEONE CLAIMS TO BE A CHROMECAST");

    if (msg && msg.game_id) {

    } else {
      // This is a new game
      game = new GameFsm();
      console.log("Made a new game with id", game.id());
      active_games[game.id()] = game;

      socket.emit('game-id', {id: game.id()});

      game.new_cast(socket);
    }
  });

  socket.on('join-game', function (msg) {
    if (msg && msg.game_id) {
      console.log("A client wants to join " + msg.game_id);
    }
  });

  socket.on('jump', function (socket) {
      chromecast.emit('jump');
  });
});

// In case paths start conflicting
// app.use('/static', express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/receiver'));
app.use(express.static(__dirname + '/client'));
app.use(express.static(__dirname + '/sender'));

http.listen(3339, function(){
  console.log('listening on *:3339');
});
