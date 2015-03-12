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
