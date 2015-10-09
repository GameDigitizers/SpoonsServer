'use strict';
var WIDTH_TO_HEIGHT = 125 / 182;

var client_fsm = new machina.Fsm({
  initialize: function(options) {
    this.avatar_size = 75;
    this.avatars = [
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

    this.resizers = [];

    this.svg = d3.select('svg');

    this.socket = io();

    this.socket.on('game-end', function(message) {
      this.transition('game-end');
    }.bind(this));

    this.socket.on('cheat', function(message) {
      console.log('server called me a cheater');
    }.bind(this));

    this.socket.on('hand', function(message) {
      this.hand = {
        cards: message.hand,
        cardById: function(id) {
          for (var i = 0; i < this.cards.length; i++) {
            if (this.cards[i].id === id) {
              return this.cards[i];
            }
          }
          return null;
        }

      };
      this.card_count_change();
      this.handle('card-change');
    }.bind(this));

    this.socket.on('incoming-available', function(msg) {
      console.log("Something tells me there", (msg.available ? "are" : "aren't"), "cards to draw");

      this.handle('available-cards', msg.available);
    }.bind(this));

    this.socket.on('new-card', function(msg) {
      console.log("I just picked up a", msg.card);
      console.log(this.hand);

      this.handle('new-card', msg.card);
    }.bind(this));

    this.socket.on('choose-avatar', function(msg) {
      console.log("choose-avatar");

      this.transition('pick-avatar');
    }.bind(this));

    this.socket.on('play', function() {
      this.transition('play');
    }.bind(this));

    this.resize_recalc();
  },

  namespace: 'spoons-client',

  initialState: 'need-game',

  resize_recalc: function() {
    this.width = $('svg').width();
    this.height = $('svg').height();

    this.spoonSettings = {
      width: 20,
      height: 100,
      x: this.width - 300,
      y: 50
    };

    if (this.width / this.height > WIDTH_TO_HEIGHT) {
      this.pending_card_height = .7 * this.height;
      this.pending_card_width = this.pending_card_height * WIDTH_TO_HEIGHT;
      this.card_height = .2 * this.height;
      this.card_width = this.card_height * WIDTH_TO_HEIGHT;
    } else {
      this.pending_card_width = .8 * this.width;
      this.pending_card_height = this.pending_card_width / WIDTH_TO_HEIGHT;
      this.card_width = .2 * this.width;
      this.card_height = this.card_width / WIDTH_TO_HEIGHT;
    }
  },

  card_count_change: function() {
    this.hand_spacing = (this.width - this.card_width * this.hand.cards.length) / (this.hand.cards.length + 1);
  },

  drawHand: function(image_selection) {
    return image_selection
      .attr('x', function(theCard, index) {
        return index * this.card_width + this.hand_spacing * (index + 1);
      }.bind(this))
      .attr('y', this.height - this.card_height)
      .attr('width', this.card_width)
      .attr('height', this.card_height);



  },

  build_draw_card: function() {
    this.next_card = this.svg.append('g')
      .attr('id', 'draw-button')
      .append('svg:image')
      .style('display', 'none')
      .attr('xlink:href', 'images/blueGrid.png')
      .on('click', function() {
        var pendingCard = d3.selectAll('.the-pending-card');
        if (!pendingCard.empty()) { //if we don't already have a pending card then we request a new one (so no cheating and taking 2 right now)
          this.socket.emit('pass', pendingCard.datum());
          pendingCard.remove();
        }
        this.socket.emit('pull-card');
      }.bind(this));

    var resize = function() {
      this.next_card
        .attr('x', -(this.pending_card_width / 2))
        .attr('y', 0.4 * this.height - this.pending_card_height / 2)
        .attr('width', this.pending_card_width)
        .attr('height', this.pending_card_height);
    }.bind(this);

    this.register_resizer(resize);

    resize();
  },

  register_resizer: function(resizer) {
    this.resizers.push(resizer);
  },

  resize: function() {
    this.resize_recalc();

    _.forEach(this.resizers, function(resizer) {
      resizer();
    });
  },

  draw_pending_card: function(pending_selection) {
    pending_selection
      .attr('x', this.width / 2 - this.pending_card_width / 2)
      .attr('y', 0.4 * this.height - this.pending_card_height / 2)
      .attr('width', this.pending_card_width)
      .attr('height', this.pending_card_height);
  },

  states: {
    'need-game': {
      _onEnter: function() {
        // Eventually need a view for this
        this.socket.emit('join-game', {
          gameId: window.location.hash
        });

        // this.transition('pick-avatar');
      }
    },

    'pick-avatar': {
      _onEnter: function() {
        this.svg.selectAll().remove();

        this.svg.selectAll('.avatar')
          .data(this.avatars)
          .enter()
          .append('svg:image')
          .attr('class', 'avatar')
          .attr('x', function(player, index) {
            return (100 * index) % 500;
          })
          .attr('y', function(player, index) {
            return 100 * (Math.floor((100 * index) / 500));
          })
          .attr('width', this.avatar_size)
          .attr('height', this.avatar_size)
          .attr('xlink:href', function(avatar) {
            return 'images/' + avatar;
          })
          .on('click', function(avatar) {
            this.socket.emit('avatar-choice', {
              avatar: avatar
            });
            console.log("transitioning to before-start");
            this.transition('before-start');
          }.bind(this));
      },
      _onExit: function() {
        this.svg.selectAll('.avatar').remove();
      },
    },


    'before-start': {
      _onEnter: function() {
        console.log("in before-start");
        this.socket.emit('player-ready', {
          ready: true
        });


        // this.transition('play');

        this.svg.append('text')
          .classed('waiting', true)
          .attr('y', 50)
          .text('Waiting for other players');
      },
      _onExit: function() {
        this.svg.selectAll('.waiting').remove();

        // Do all the appending her in the on exit so that we don't reappend
        // everytime we transition to play
        this.handSelection = this.svg.append('g')
          .attr('class', 'hand');

        // Add draw card card
        this.build_draw_card();

        // Add the pending card
        this.pending_card_g = this.svg.append('g')
          .attr('class', 'pending-card');

        this.spoonImage = this.svg.append('svg:image')
          .attr('xlink:href', function(theCard) {
            return 'images/spoon.png';
          })
          .on('click', function() {
            // this.socket.emit('take-spoon');
            this.spoonImage.remove();
            this.transition('puzzle');
          }.bind(this));
      },
    },

    play: {
      _onEnter: function() {


        var resize = function() {
          this.spoonImage
            .attr('x', this.spoonSettings.x)
            .attr('y', this.spoonSettings.y)
            .attr('width', this.spoonSettings.width)
            .attr('height', this.spoonSettings.height);
        }.bind(this);

        this.register_resizer(resize);

        resize();

        d3.select('body')
          .on('keydown', function () {
            if (d3.event.keyCode === 39) { //arrow right
              this.next_card.on('click')();
            } else if (d3.event.keyCode === 40) { //arrow down
              console.log('down');
              this.keep_card = d3.selectAll('.the-pending-card').datum();
              this.transition('keep-card', this.keep_card);
            }
          }.bind(this))
      },

      'card-change': function() {
        console.log("Drawing hand");
        var dataSelection = this.handSelection.selectAll('.card')
          .data(this.hand.cards);

        var image_selection = dataSelection
          .enter()
          .append('svg:image')
          .attr('id', function(theCard) {
            return theCard.id;
          })
          .attr('class', 'card')
          .attr('xlink:href', function(theCard) {
            return 'images/' + theCard.src;
          });


        this.drawHand(image_selection);
      },

      'new-card': function(card) {
        var pending_cards = this.pending_card_g
          .selectAll('.the-pending-card')
          .data([card])
          .enter()
          .append('svg:image')
          .attr('id', function(theCard) {
            return theCard.id;
          })
          .attr('class', 'the-pending-card')
          .attr('xlink:href', function(theCard) {
            return 'images/' + theCard.src;
          })
          .on('click', function(theCard) {
            d3.select('.the-pending-card').remove();
            this.socket.emit('pass', theCard);
          }.bind(this));

        var mc = new Hammer($('.the-pending-card')[0]);
        mc.get('swipe').set({
          direction: Hammer.DIRECTION_ALL
        });

        mc.on('swipedown', function(evt) {
          this.keep_card = card;
          this.transition('keep-card', card);
        }.bind(this));

        this.draw_pending_card(pending_cards);
      },

      // 'resize': function () {
      //   console.log("fsm resize");
      //   this.resize_recalc();

      //   // debugger;
      //   this.drawHand(d3.selectAll('.card'));
      //   this.draw_pending_card(d3.selectAll('.the-pending-card'));
      // },

      'available-cards': function(available) {
        console.log("in available-cards");
        if (available) {
          this.next_card.style('display', null);
        } else {
          this.next_card.style('display', 'none');
        }
      }
    },

    'puzzle': {
      _onEnter: function () {
        this.handSelection.remove();
        this.pending_card_g.remove();
        this.next_card.remove();

        this.handle('draw-puzzle');
      },

      'draw-puzzle': function () {
        var fsm = this;
        console.log("Drawing the puzzle");

        var candidates = _.shuffle([
          [this.width/3, this.height/3],
          [this.width/3, 2*this.height/3],
          [2*this.width/3, this.height/3],
          [2*this.width/3, 2*this.height/3]
        ]);

        var places = chance.pick(candidates, 2);

        console.log(places[0], places[1]);

        this.svg.selectAll('.node').remove();
        this.svg.selectAll('.node-text').remove();

        var next_circle = 0;
        this.svg.selectAll('.node')
            .data(places)
            .enter()
            .append('circle')
            .classed('node', true)
            .attr('cx', function (d) {
              return d[0];
            })
            .attr('cy', function (d) {
              return d[1];
            })
            .attr('r', 20)
            .on('mouseover', function (d, i) {
              if (i === next_circle) {
                d3.select(this).classed('selected', true);
                d3.select('#node-' + i).classed('selected', true);
                next_circle++;
              } else {
                console.log("Incorrect, redraw");
                fsm.handle('draw-puzzle');
              }
            });

        this.svg.selectAll('.node-text')
          .data(places)
          .enter()
          .append('text')
          .classed('node-text', true)
          .attr('id', function (d, i) {
            return 'node-' + i;
          })
          .attr('x', function (d) {
            return d[0];
          })
          .attr('y', function (d) {
            return d[1];
          })
          .text(function (d, i) {
            return i;
          });

      },
    },

    'game-end': {
      _onEnter: function() {
        this.spoonImage.remove();
        this.svg.append('text')
          .classed('game-end', true)
          .attr('x', this.width / 2)
          .attr('y', this.height / 2)
          .text('CLICK TO START NEW GAME!')
          .on('click', function() {
            // this.socket.emit('player-ready', {readytrue});
            this.transition('before-start');
          }.bind(this));
      },
      _onExit: function() {
        d3.select('.game-end').remove();
        this.handSelection.remove();
        this.pending_card_g.remove();
        this.next_card.remove();
      }
    },

    'keep-card': {
      _onEnter: function() {
        console.log("keep card _onEnter", this.keep_card);

        this.hand.cards.push(this.keep_card);
        console.log(this.hand);

        var dataSelection = this.handSelection.selectAll('.card')
          .data(this.hand.cards);

        var image_selection = dataSelection
          .enter()
          .append('svg:image')
          .attr('id', function(theCard) {
            return theCard.id;
          })
          .attr('class', 'card')
          .attr('xlink:href', function(theCard) {
            return 'images/' + theCard.src;
          });

        d3.select('.the-pending-card').remove();

        this.card_count_change();
        this.drawHand(d3.selectAll('.card'));

        this.discardAnimate();
      }
    },

    'post-kept-animation': {
      _onEnter: function() {
        this.card_count_change();

        var n = 0;

        this.drawHand(d3.selectAll('.card')
          .transition()
          .ease('linear')
          .duration(250)
          .each(function() {
            ++n;
          })
          .each("end", function() {
            if (!--n) {
              this.transition('play');
            }
          }.bind(this)));

        this.transition('play');
      }
    }
  },

  discardAnimate: function() {
    setTimeout(function() {
      var that = this;

      this.handSelection.selectAll('.card')
        .on('click', function (pass_card) {
          d3.select(this).remove();

          that.socket.emit('pass', pass_card);

          _.remove(that.hand.cards, function(card) {
            return card.id === pass_card.id;
          });

          console.log(that.hand);

          //remove this gesture listener
          that.transition('post-kept-animation');
        })
        .transition()
        .attr('x', function(theCard, index) {
          var elem = d3.select(this);
          var oldX = elem.attr('x');
          console.log(oldX);
          var oldY = elem.attr('y')
          console.log(oldY);
          // give the cards 90% of the height, and split the other 10% for the spacing
          var pass_card_height = that.height * .8 / that.hand.cards.length;
          var pass_card_space_height = (that.height * .2) / (that.hand.cards.length + 1);

          // set the cards' width based on their height (and the card width:height ratio)
          var pass_card_width = pass_card_height * WIDTH_TO_HEIGHT;

          var pass_card_x = that.width / 2 - pass_card_width / 2; // - oldX;
          var pass_card_y = index * pass_card_height + pass_card_space_height * (index + 1); // - oldY;
          return pass_card_x;
        })
        .attr('y', function(theCard, index) {
          var elem = d3.select(this);
          var oldX = elem.attr('x');
          console.log(oldX);
          var oldY = elem.attr('y')
          console.log(oldY);
          // give the cards 90% of the height, and split the other 10% for the spacing
          var pass_card_height = that.height * .8 / that.hand.cards.length;
          var pass_card_space_height = (that.height * .2) / (that.hand.cards.length + 1);

          // set the cards' width based on their height (and the card width:height ratio)
          var pass_card_width = pass_card_height * WIDTH_TO_HEIGHT;

          var pass_card_x = that.width / 2 - pass_card_width / 2; // - oldX;
          var pass_card_y = index * pass_card_height + pass_card_space_height * (index + 1); // - oldY;
          return pass_card_y;

        })
        .ease('linear')
        .duration(250);
    }.bind(this), 250);
  }
});

$(window).resize(function() {
  console.log('resizing');
  client_fsm.resize();
});
