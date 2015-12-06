var _ =   require('lodash');

var machina = require('machina');
var chance = new require('chance')();
var chalk = require('chalk');

var PlayerFsm = require('./playerFsm').PlayerFsm;
var cards = require('./cards').card_files;

var INITIAL_AVATARS = [
  {
    img:'bear.png',
    taken: false
  },
  {
    img:'beaver.png',
    taken: false
  },
  {
    img:'bee.png',
    taken: false
  },
  {
    img:'chicken.png',
    taken: false
  },
  {
    img:'cow.png',
    taken: false
  },
  {
    img:'dog.png',
    taken: false
  },
  {
    img:'elephant.png',
    taken: false
  },
  {
    img:'giraffe.png',
    taken: false
  },
  {
    img:'goat.png',
    taken: false
  },
  {
    img:'hippo.png',
    taken: false
  },
  {
    img:'owl.png',
    taken: false
  },
  {
    img:'penguin.png',
    taken: false
  },
  {
    img:'pig.png',
    taken: false
  },
  {
    img:'sheep.png',
    taken: false
  },
  {
    img:'turkey.png',
    taken: false
  },
  {
    img:'zebra.png',
    taken: false
  },
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
        _.findWhere(this.available_avatars, {img:msg.avatar.img}).taken=true;

        this.players.filter(function (player) {
          return player.socket_id !== msg.player.socket_id;
        }).forEach(function (player) {
          player.chooseAvatar(this.available_avatars);
        }.bind(this));
        this.chromecast_message({
          type: 'new-player',
          message: {
            avatar: msg.avatar.img,
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

      pass: function (message) {
        console.log(chalk.green.bold('P' + message.player.playerId) + 
          ' passes ' + 
          chalk.blue.bold(message.value + toSymbol(message.suit)) + ' ' + 
          ' to ' +
          chalk.green.bold('P' + message.player.next_player.playerId));

        this.chromecast_message({
          type: 'pass',
          message: {
            player: message.player.playerId,
          }
        });
      },

      puzzle: function (message) {
        message.player.emit_message('puzzle-length', {
          playerCount: this.players.length,
        });
      },

      'puzzle-end': function (message) {
        message.player.emit_message('got-spoon', {
          gotSpoon: true,
        });

        this.chromecast_message({
          type: 'take-spoon',
          message: {
            player: message.player.playerId,
          }
        });

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

    chromecast.join(this.gameId);
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
      socket:   socket,
      game:     this,
      playerId: this.players.length,
    });
    this.players.push(player);

    player.socket.join(this.gameId);
    player.socket.on('disconnect', function () {
      console.log('We have lost a player folks!');
    });

    this.handle('new-player', player);
  },
});


function toSymbol(suit) {
  if (suit === 'hearts') {
    return '♥';
  }
  if (suit === 'spades') {
    return '♠';
  }
  if (suit === 'diamonds') {
    return '♦';
  }
  if (suit === 'clubs') {
    return '♣';
  }
  console.log('No suit for: ' + suit);
  return '';
}
