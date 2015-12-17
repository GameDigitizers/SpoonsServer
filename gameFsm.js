var _ =   require('lodash');

var machina = require('machina');
var Chance = new require('chance');
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
    this.playerQueue = [];

    this.available_avatars = INITIAL_AVATARS;

    this.gameId = gameId;

    this.spoonsTaken = 0;
    this.chance = Chance(new Date().getTime());
  },

  namespace: 'spoons',
  initialState: 'lobby',

  states: {
    lobby: {
      _onEnter: function () {
        console.log("adding queued " + this.playerQueue.length + " players to game");
        this.playerQueue.forEach(function (socket) {
          this.createPlayer(socket);
        }.bind(this));

        this.playerQueue = [];
      },

      'new-player': function (socket) {
        console.log('new player in gameFSM ;');
        this.createPlayer(socket);
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

        var deck = this.chance.shuffle(cards);
        _.forEach(this.players, function (player) {
          player.set_hand(deck.splice(0, 4));
        });

        this.players[0].incoming_cards(deck);
      },

      'new-player': function (socket) {
        console.log('got new player but game in progess!');
        this.playerQueue.push(socket);

        var currentAvatars = this.players.map(function (player) {
          return player.avatar.img;
        });

        socket.emit('enqueued', currentAvatars);
      },

      pass: function (message) {
        // console.log(chalk.green.bold('P' + message.player.playerId) + 
        //   ' passes ' + 
        //   chalk.blue.bold(message.value + toSymbol(message.suit)) + ' ' + 
        //   ' to ' +
        //   chalk.green.bold('P' + message.player.next_player.playerId));

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
    this.handle('new-player', socket);
  },

  nextPlayer: function (playerId) {
    var index = 0;
    for (var i = this.players.length - 1; i >= 0; i--) {
      if (this.players[i].playerId === playerId) {
        index = (i + 1) % this.players.length;
      }
    }

    return this.players[index];
  },

  removePlayer: function (player) {
    console.log('We have lost a player folks! removing from this.players');

    if (player.hasOwnProperty('avatar') && player.avatar && player.avatar.hasOwnProperty('img')) {
      var newlyAvailableAvatar = _.findWhere(this.available_avatars, {img:player.avatar.img})
      if (newlyAvailableAvatar) {
        newlyAvailableAvatar.taken = false;
      }
    }

    var nextPlayer = this.nextPlayer(player.playerId);
    nextPlayer.incoming_cards(player.incoming);

    this.players = this.players.filter(function (p) {
      return p.playerId !== player.playerId;
    });

    if (this.players.length < 2) {
      this.io.to(this.gameId).emit('game-end');
      this.transition('lobby');
    }
  },

  createPlayer: function (socket) {
    var player = new PlayerFsm({
      socket:   socket,
      game:     this,
      playerId: socket.id,
    });
    this.players.push(player);

    player.socket.join(this.gameId);
    player.socket.on('disconnect', function () {
      this.removePlayer(player);
    }.bind(this));

    player.chooseAvatar(this.available_avatars);
    return player;
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
