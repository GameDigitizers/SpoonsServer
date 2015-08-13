var _ =   require('lodash');

var machina = require('machina');
var chance = new require('chance')();
var chalk = require('chalk');

var PlayerFsm = require('./playerFsm').PlayerFsm;
var cards = require('./cards').card_files;

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

exports.GameFsm = machina.Fsm.extend({
  initialize: function (io, gameId) {
    console.log('In GameFSM initialize ', gameId);

    this.io = io;

    this.chromecasts = [];
    this.players = [];

    this.available_avatars = INITIAL_AVATARS;

    this.gameId = gameId;

    this.spoonsTaken = 0;
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

        this.io.to(this.gameId).emit('play');

        var deck = chance.shuffle(cards);
        _.forEach(this.players, function (player) {
          player.set_hand(deck.splice(0, 4));
        });

        this.players[0].incoming_cards(deck);

        // Tell everyone who to pass to
        this.players[this.players.length-1].next_player = this.players[0];
        for (i = 1; i < this.players.length; i++) {
          this.players[i-1].next_player = this.players[i];
        }
      },

      'take-spoon': function () {
        this.spoonsTaken++;

        // tell the clients? who knows?

        // todo tell chromecast

        // todo 
        if (this.spoonsTaken == this.players.length - 1) {
          // we're done ... do something
          this.io.to(this.gameId).emit('game-end');
          this.transition('lobby');
        }
      },

      _onExit: function () {
        this.spoonsTaken = 0;
        this.players.forEach(function (player) {
          console.log(player);
          player.ready = false;
          player.next_player = null;
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
    return this.gameId;
  },

  newCast: function (chromecast) {
    console.log("Just met a new chromecast", chromecast.id);
    this.chromecasts.push(chromecast);

    // this.handle('send-view')
  },

  handleMessage: function (args) {
    var message = args.msg || {};

    console.log(chalk.black("handleMessage"), args.type, message);
    message.player = _.findWhere(this.players, {socket_id: args.socketId});

    message.player.handle_message(args.type, message);
    this.handle(args.type, message);
  },

  newPlayer: function (socket) {
    var player = new PlayerFsm({
      socket: socket,
      game:   this
    });
    this.players.push(player);

    player.socket.join(this.gameId);

    this.handle('new-player', player);
  }
});
