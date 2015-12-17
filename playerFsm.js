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
    this.hand      = [];
    this.incoming  = [];
    this.playerId  = options.playerId;

    this.game.on('transition', function (data) {
      console.log("The game transitioned", data);
      if (data.toState == 'play') {
        console.log("transitioning to play");
        this.transition('play');
      } else if (data.toState == 'lobby') {
        this.transition('waiting');
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

      'pull-card': function () {
        if (this.hand.length < 5) { // player already has pending card don't send more unless they are cleared to cheat
          if (this.incoming.length > 0) {
            var card = this.incoming.splice(0, 1)[0];
            this.hand.push(card);

            this.emit_message('new-card', { card: card });
          } else {
            console.log(chalk.red.bold("Client asked for card but none available"));
          }
        } else {
          this.socket.emit('cheat');
        }

        if (this.incoming.length == 0) {
          this.emit_message('incoming-available', { available: false });
        }
      },

      pass: function (data) {
        console.log("Player wants to pass", _.keys(data));

        var pass_index = _.findIndex(this.hand, 'id', data.id);

        if (pass_index > -1) {
          var card = this.hand.splice(pass_index, 1)[0];
          var nextPlayer = this.game.nextPlayer(this.playerId);
          nextPlayer.new_incoming_card(card);
        } else {
          console.log(chalk.red.bold("Client passed card not in hand"));
        }
      },

      _onExit: function () {
        this.incoming = [];
        this.hand = [];
      }
    }
  },

  new_incoming_card: function (card) {
    console.log('this player got an incoming card and currently has ' + this.incoming.length + ' in queue');

    // Send everytime now to attempt a brute force fix of our non-passing bug
    // if (this.incoming.length == 0) {
      this.emit_message('incoming-available', {available: true});
    // }

    this.incoming.push(card);
  },

  incoming_cards: function (cards) {
    this.incoming = this.incoming.concat(cards);
    this.emit_message('incoming-available', {available: true});
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
