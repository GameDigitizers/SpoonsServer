var _ =   require('lodash');

var machina = require('machina');
var chance = new require('chance')();
var chalk = require('chalk');

exports.PlayerFsm = machina.Fsm.extend({

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
      }
    }.bind(this));
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
      },
      '*': function () {
        console.log(chalk.red.bold("Nothing to do with this mofo"));
      }
    },
    play: {
      _onEnter: function () {
        console.log("Player is ready to PLAY");
      },
    }
  },

  chooseAvatar: function (available_avatars) {
    this.emit_message('choose-avatar', { avatars: available_avatars }); 
  },

  set_hand: function (hand) {
    this.hand = hand;

    this.emit_message('hand', {
      hand: hand
    });
  },

  handle_message: function (type, message) {
    this.handle(type, message);
  },

  emit_message: function (type, message) {
    this.socket.emit(type, message);
  },
});
