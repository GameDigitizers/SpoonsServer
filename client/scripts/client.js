
var WIDTH_TO_HEIGHT = 125/182;

var client_fsm = new machina.Fsm({
  initialize: function (options) {
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

    this.svg = d3.select('svg');
    this.svg_width = $('svg').width();
    this.svg_height = $('svg').height();

    this.socket = io();

    this.socket.on('hand', function (message) {
      this.hand = {
        cards: message.hand,
        cardById: function (id) {
          for (var i=0; i<this.cards.length; i++) {
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

    this.socket.on('incoming-available', function (msg) {
      console.log("Something tells me there", (msg.available ? "are" : "aren't"), "cards to draw");

      this.handle('available-cards', msg.available);
    }.bind(this));

    this.socket.on('new-card', function (msg) {
      console.log("I just picked up a", msg.card);

      this.handle('new-card', msg.card);
    }.bind(this));

    this.resize_recalc();
  },

  namespace: 'spoons-client',

  initialState: 'need-game',

  resize_recalc: function () {
    this.width = $('svg').width();
    this.height = $('svg').height();

    if (this.width/this.height > WIDTH_TO_HEIGHT) {
        this.pending_card_height = .7*this.height;
        this.pending_card_width  = this.pending_card_height*WIDTH_TO_HEIGHT;
        this.card_height         = .2*this.height;
        this.card_width          = this.card_height*WIDTH_TO_HEIGHT;
    } else {
        this.pending_card_width  = .8*this.width;
        this.pending_card_height = this.pending_card_width/WIDTH_TO_HEIGHT;
        this.card_width          = .2*this.width;
        this.card_height         = this.card_width/WIDTH_TO_HEIGHT;
    }
  },

  card_count_change: function () {
    this.hand_spacing = (this.width - this.card_width*this.hand.cards.length)/(this.hand.cards.length+1);
  },

  drawHand: function (image_selection) {
    image_selection
        .attr('x', function (theCard, index) {
            return index*this.card_width + this.hand_spacing*(index+1);
        }.bind(this))
        .attr('y', this.height - this.card_height)
        .attr('width', this.card_width)
        .attr('height', this.card_height);

    this.next_card
        .attr('x', -(this.pending_card_width / 2))
        .attr('y', 0.4 * this.height - this.pending_card_height/2)
        .attr('width', this.pending_card_width)
        .attr('height', this.pending_card_height);


  },

  draw_pending_card: function (pending_selection) {
    pending_selection
      .attr('x', this.width / 2 - this.pending_card_width/2)
      .attr('y', 0.4 * this.height - this.pending_card_height/2)
      .attr('width', this.pending_card_width)
      .attr('height', this.pending_card_height);
  },

  states: {
    'need-game': {
      _onEnter: function () {
        // Eventually need a view for this
        this.socket.emit('join-game', {
          game_id: 'SPOON'
        });

        this.transition('pick-avatar');
      }
    },

    'pick-avatar': {
      _onEnter: function () {
        this.svg.selectAll().remove();

        this.svg.selectAll('.avatar')
          .data(this.avatars)
          .enter()
            .append('svg:image')
            .attr('class', 'avatar')
            .attr('x', function (player, index) {
              return (100 * index) % 500;
            })
            .attr('y', function (player, index) {
              return 100 * (Math.floor((100 * index) / 500));
            })
            .attr('width', this.avatar_size)
            .attr('height', this.avatar_size)
            .attr('xlink:href', function (avatar) {
              return 'images/' + avatar;
            })
            .on('click', function (avatar) {
              this.socket.emit('avatar-choice', {avatar: avatar});
              console.log("transitioning to before-start");
              this.transition('before-start');
            }.bind(this));
      }
    },

    'before-start': {
      _onEnter: function () {
        console.log("in before-start");
        this.socket.emit('player-ready', {ready: true});

        this.svg.selectAll('.avatar').remove();

        this.handSelection = this.svg.append('g')
          .attr('class', 'hand');

        // Add draw card card
        this.next_card = this.svg.append('g')
            .attr('id', 'draw-button')
            .append('svg:image')
            .style('display', 'none')
            .attr('xlink:href', 'images/blueGrid.png')
            .on('click', function () {
              this.socket.emit('pull-card');
            }.bind(this));

        // Add the pending card
        this.pending_card_g = this.svg.append('g')
            .attr('class', 'pending-card');
      },

      'card-change': function () {
        console.log("Drawing hand");
        dataSelection = this.handSelection.selectAll('.card')
            .data(this.hand.cards);

        image_selection = dataSelection
            .enter()
            .append('svg:image')
              .attr('id', function (theCard) {
                return theCard.id;
              })
              .attr('class', 'card')
              .attr('xlink:href', function (theCard) {
                return 'images/' + theCard.src;
              });


        this.drawHand(image_selection);
      },

      'new-card': function (card) {
        pending_cards = this.pending_card_g
          .selectAll('.the-pending-card')
          .data([card])
          .enter()
          .append('svg:image')
            .attr('id', function (theCard) {
              return theCard.id;
            })
            .attr('class', 'the-pending-card')
            .attr('xlink:href', function (theCard) {
              return 'images/' + theCard.src;
            })
            .on('click', function (theCard) {
              d3.select('.the-pending-card').remove();
              this.socket.emit('pass', theCard);
            }.bind(this));
        this.draw_pending_card(pending_cards);
      },

      'resize': function () {
        console.log("fsm resize");
        this.resize_recalc();

        // debugger;
        this.drawHand(d3.selectAll('.card'));
        this.draw_pending_card(d3.selectAll('.the-pending-card'));
      },

      'available-cards': function (available) {
        console.log("in available-cards");
        if (available) {
          this.next_card.style('display', null);
        } else {
          this.next_card.style('display', 'none');
        }
      }
    }
  }
});

$(window).resize(function () {
    console.log('resizing');
    client_fsm.handle('resize');
});
