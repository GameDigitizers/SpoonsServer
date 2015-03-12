var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var _ =   require('lodash');
var machina = require('machina');
var chance = new require('chance')();
var cards = require('./cards').card_files;

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

var INITIAL_AVATARS = [
  'bear.png',
  'beaver.png',
  'bee.png',
  'chicken.png',
  'cow.png',
  'dog.png',
  'elephant.png',
  'giraffe.png',
  'goat.png',
  'hippo.png',
  'owl.png',
  'penguin.png',
  'pig.png',
  'sheep.png',
  'turkey.png',
  'zebra.png'
];

var Player = function (game, socket) {

  this.ready = false;

  socket.on('player-ready', function (message) {
    console.log("FIRST Player says his readiness is", message.ready);

    this.ready = message.ready;
  }.bind(this));

  this.chooseAvatar = function (available_avatars) {
    socket.emit('choose-avatar', { avatars: available_avatars }); 
  }

  this.set_hand = function (hand) {
    console.log("Player " + socket.id + " has", hand);
    this.hand = hand;

    socket.emit('hand', {
      hand: hand
    });
  }

}

var chromecast = null;

var GameFsm = machina.Fsm.extend({
  initialize: function () {
    this.chromecasts = [];
    this.players = [];

    this.available_avatars = INITIAL_AVATARS;

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
      'new-player': function (player) {
        player.chooseAvatar(this.available_avatars);
      },

      'avatar-choice': function (msg) {
        console.log("Trying to tell chromecast about", msg);

        this.chromecast_message({
          type: 'new-player',
          message: {
            avatar: msg.avatar
          }
        });
      },

      'player-ready': function () {
        var all_ready = _.every(this.players, function (player) {
          return player.ready;
        });

        if (this.players.length > 1 && all_ready) {
          this.transition('deal');
        }
      }
    },

    deal: {
      _onEnter: function () {
        this.chromecast_message('transition-to-table');
        console.log("Need to do some dealing");

        var deck = chance.shuffle(cards);
        _.forEach(this.players, function (player) {
          player.set_hand(deck.splice(0, 4));
        });
      }
    }
  },

  chromecast_message: function (message_spec) {
    _.forEach(this.chromecasts, function (chromecast) {
      if (typeof(message_spec) === "string") {
        chromecast.emit(message_spec);
      } else {
        chromecast.emit(message_spec.type, message_spec.message);
      }
    });
  },

  id: function () {
    return this.game_id;
  },

  new_cast: function (chromecast) {
    console.log("Just met a new chromecast", chromecast.id);
    this.chromecasts.push(chromecast);

    // this.handle('send-view')
  },

  new_player: function (socket) {
    var player = new Player(this, socket);
    this.players.push(player);

    socket.on('jump', function (socket) {
        this.chromecast_message({
          type: 'jump',
          message: {}
        });
    }.bind(this));

    socket.on('pass', function (card) {
      console.log('i should pass the card', card);
    });

    socket.on('keep', function (card) {
      console.log('user is keeping card', card);
    });

    socket.on('avatar-choice', function (msg) {
      console.log('user wants to be', msg);
      this.handle('avatar-choice', msg);
    }.bind(this));

    socket.on('player-ready', function (message) {
      console.log("Second player ready in GAME", message);
      this.handle("player-ready");
    }.bind(this));

    this.handle('new-player', player);
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

      if (_.has(active_games, msg.game_id)) {
        active_games[msg.game_id].new_player(socket);
      }
    }
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
