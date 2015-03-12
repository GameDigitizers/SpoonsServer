var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var _ =   require('lodash');
var machina = require('machina');
var chance = new require('chance')();
var cards = require('./cards').card_files;
var router = require('socket.io-events')();
var chalk = require('chalk');
chalk.enabled = true;

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

// var Player = function (game, socket) {

//   this.ready = false;
//   this.socket_id = socket.id;

// }

var PlayerFsm = machina.BehavioralFsm.extend({

  initialize: function (options) {
    console.log(_.keys(options));
    this.socket    = options.socket;
    this.socket_id = options.socket.id;
    this.ready     = false;
    this.game      = options.game;

    this.game.on('transition', function (data) {
      console.log("The game transitioned", data);
      if (data.toState == 'play') {
        console.log("transitioning to play");
        this.transition('play');
        this.handle("dangit");
      }
    });
  },

  namespace: 'player',
  initialState: 'waiting',

  states: {
    waiting: {
      'player-ready': function (message) {
        if (_.has(message, 'ready')) {
          this.ready = message.ready;
        }
      },
      'avatar-choice': function (msg) {
        this.avatar = msg.avatar;
        this.transition('play');
      },
      '*': function () {
        console.log(chalk.red.bold("Nothing to do with this mofo"));
      }
    },
    play: {
      _onEnter: function () {
        console.log("Player is ready to PLAY");
      },
      dangit: function () {
        console.log(chalk.inverse.red("suckit"));
      }
    }
  },

  chooseAvatar: function (available_avatars) {
    this.emit('choose-avatar', { avatars: available_avatars }); 
  },

  set_hand: function (hand) {
    this.hand = hand;

    this.emit('hand', {
      hand: hand
    });
  },

  handle_message: function (type, message) {
    this.handle(type, message);
  },

  emit: function (type, message) {
    this.socket.emit(type, message);
  },
});


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
        this.chromecast_message({
          type: 'new-player',
          message: {
            avatar: msg.avatar
          }
        });
      },

      'player-ready': function (message) {
        message.player.ready = message.ready;

        var all_ready = _.every(this.players, function (player) {
          return player.ready;
        });

        if (this.players.length > 1 && all_ready) {
          this.transition('play');
        }
      }
    },

    play: {
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

  handle_message: function (socket_id, type, message) {
    var message = message || {};

    console.log(chalk.black("handle_message"), type, message);
    message.player = _.findWhere(this.players, {socket_id: socket_id});

    message.player.handle_message(type, message);
    this.handle(type, message);
  },

  new_player: function (socket) {
    var player = new PlayerFsm({
      socket: socket,
      game:   this
    });
    this.players.push(player);

    this.handle('new-player', player);
  }
});

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
