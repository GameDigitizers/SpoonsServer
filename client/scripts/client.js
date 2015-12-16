'use strict';
var WIDTH_TO_HEIGHT = 125 / 182;

var clientFsm = new machina.Fsm({
  // initialize: function(options) {
  initialize: function() {
    this.avatarSize = 75;
    this.avatars = [
      // 'bear.png',
      // 'beaver.png',
      // 'bee.png',
      // 'chicken.png',
      // 'cow.png',
      // 'dog.png',
      // 'elephant.png',
      // 'giraffe.png',
      // 'goat.png',
      // 'hippo.png',
      // 'owl.png',
      // 'penguin.png',
      // 'pig.png',
      // 'sheep.png',
      // 'turkey.png',
      // 'zebra.png'
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
      this.cardCountChange();
      this.handle('card-change');
    }.bind(this));

    this.socket.on('incoming-available', function(msg) {
      console.log('Something tells me there', (msg.available ? 'are' : 'aren\'t'), 'cards to draw');

      this.handle('available-cards', msg.available);
    }.bind(this));

    this.socket.on('new-card', function(msg) {
      console.log('I just picked up a', msg.card);
      console.log(this.hand);

      this.handle('new-card', msg.card);
    }.bind(this));

    this.socket.on('choose-avatar', function(msg) {
      console.log('choose-avatar', msg);
      this.avatars = msg.avatars;

      this.transition('pick-avatar');
      this.handle('avatar-selection');
    }.bind(this));

    this.socket.on('play', function() {
      this.transition('play');
    }.bind(this));

    this.socket.on('puzzle-length', function(msg) {
      this.handle('puzzle-length', msg);
    }.bind(this));

    this.socket.on('got-spoon', function(msg) {
      this.handle('got-spoon', msg);
    }.bind(this));

    this.resizeRecalc();
  },

  namespace: 'spoons-client',

  initialState: 'need-game',

  resizeRecalc: function() {
    this.width = $('svg').width();
    this.height = $('svg').height();

    this.spoonSettings = {
      width: 20,
      height: 100,
      x: this.width - (20+20),
      y: 0
    };

    if (this.width / this.height > WIDTH_TO_HEIGHT) {
      this.pendingCardHeight = 0.7 * this.height;
      this.pendingCardWidth = this.pendingCardHeight * WIDTH_TO_HEIGHT;
      this.cardHeight = 0.2 * this.height;
      this.cardWidth = this.cardHeight * WIDTH_TO_HEIGHT;
    } else {
      this.pendingCardWidth = 0.8 * this.width;
      this.pendingCardHeight = this.pendingCardWidth / WIDTH_TO_HEIGHT;
      this.cardWidth = 0.2 * this.width;
      this.cardHeight = this.cardWidth / WIDTH_TO_HEIGHT;
    }
  },

  cardCountChange: function() {
    this.handSpacing = (this.width - this.cardWidth * this.hand.cards.length) / (this.hand.cards.length + 1);
  },

  drawHand: function(imageSelection) {
    return imageSelection
      .attr('x', function(theCard, index) {
        return index * this.cardWidth + this.handSpacing * (index + 1);
      }.bind(this))
      .attr('y', this.height - this.cardHeight)
      .attr('width', this.cardWidth)
      .attr('height', this.cardHeight);



  },

  buildDrawCard: function() {
    this.nextCard = this.svg.append('g')
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
      this.nextCard
        .attr('x', -(this.pendingCardWidth / 2))
        .attr('y', 0.4 * this.height - this.pendingCardHeight / 2)
        .attr('width', this.pendingCardWidth)
        .attr('height', this.pendingCardHeight);
    }.bind(this);

    this.registerResizer(resize);

    resize();
  },

  registerResizer: function(resizer) {
    this.resizers.push(resizer);
  },

  resize: function() {
    this.resizeRecalc();

    _.forEach(this.resizers, function(resizer) {
      resizer();
    });
  },

  drawPendingCard: function(pendingSelection) {
    pendingSelection
      .attr('x', this.width / 2 - this.pendingCardWidth / 2)
      .attr('y', 0.4 * this.height - this.pendingCardHeight / 2)
      .attr('width', this.pendingCardWidth)
      .attr('height', this.pendingCardHeight);
  },

  states: {
    'need-game': {
      _onEnter: function() {
        // Eventually need a view for this
        this.socket.emit('join-game', {
          gameId: '#42', //window.location.hash
        });

        // this.transition('pick-avatar');
      }
    },

    'pick-avatar': {
      _onEnter: function() {
        // this.handle('avatar-selection');
      },

      'avatar-selection': function () {
        console.log('avatar-selection', this.svg, this.avatars);
        this.svg.selectAll('.avatar').remove();
        
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
          .attr('width', this.avatarSize)
          .attr('height', this.avatarSize)
          .attr('xlink:href', function(avatar) {
            return 'images/' + avatar.img;
          })
          .style('opacity', function (d) {
            // debugger
            console.log(d);
            if (d.taken) {
              console.log('gonna do .2');
              return 0.2;
            }
            else {
              return 1;
            }
          })
          .on('click', function(avatar) {
            this.socket.emit('avatar-choice', {
              avatar: avatar
            });
            console.log('transitioning to before-start');
            this.transition('before-start');
          }.bind(this));
      },

      _onExit: function() {
        this.svg.selectAll('.avatar').remove();
      },
    },


    'before-start': {
      _onEnter: function() {
        console.log('in before-start');
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
        this.buildDrawCard();

        // Add the pending card
        this.pendingCardG = this.svg.append('g')
          .attr('class', 'pending-card');

        this.spoonImage = this.svg.append('svg:image')
          .attr('xlink:href', function() {
            return 'images/spoon.png';
          })
          .on('click', function() {
            this.spoonImage.remove();
            this.transition('puzzle');
          }.bind(this));

        this.messageBox = this.svg.append('text')
          .attr('x', this.width/2)
          .attr('y', 25);
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

        this.registerResizer(resize);

        resize();

        d3.select('body')
          .on('keydown', function () {
            if (d3.event.keyCode === 39) { //arrow right
              this.nextCard.on('click')();
            } else if (d3.event.keyCode === 40) { //arrow down
              console.log('down');
              this.keepCard = d3.selectAll('.the-pending-card').datum();
              this.transition('keep-card', this.keepCard);
            }
          }.bind(this));
      },

      'card-change': function() {
        console.log('Drawing hand');
        var dataSelection = this.handSelection.selectAll('.card')
          .data(this.hand.cards);

        var imageSelection = dataSelection
          .enter()
          .append('svg:image')
          .attr('id', function(theCard) {
            return theCard.id;
          })
          .attr('class', 'card')
          .attr('xlink:href', function(theCard) {
            return 'images/' + theCard.src;
          });


        this.drawHand(imageSelection);
      },

      'new-card': function(card) {
        var pendingCards = this.pendingCardG
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

        mc.on('swipedown', function(e) {
          console.log('swipedown', e);
          e.preventDefault();
          this.keepCard = card;
          this.transition('keep-card', card);
        }.bind(this));

        this.drawPendingCard(pendingCards);
      },

      // 'resize': function () {
      //   console.log('fsm resize');
      //   this.resizeRecalc();

      //   // debugger;
      //   this.drawHand(d3.selectAll('.card'));
      //   this.drawPendingCard(d3.selectAll('.the-pending-card'));
      // },

      'available-cards': function(available) {
        console.log('in available-cards');
        if (available) {
          this.nextCard.style('display', null);
        } else {
          this.nextCard.style('display', 'none');
        }
      }
    },

    'puzzle': {
      _onEnter: function () {
        this.socket.emit('puzzle');

        this.handSelection.remove();
        if (this.pendingCardG) {
          this.pendingCardG.remove();
        }
        if (this.nextCard) {
          this.nextCard.remove();
        }
      },

      'puzzle-length': function (message) {
        this.playerCount = message.playerCount;
        this.puzzlesCompleted = 0;
        
        this.handle('configure-puzzle');
      },

      'configure-puzzle': function () {
        console.log("Configuring the puzzle");

        var fsm = this;
        function getCandidates (w, h) {
          var candidatesList = [];
          for (var i = 1; i <= w; i++) {
            for (var j = 1; j <= h; j++) {
              candidatesList.push([i*fsm.width/w-fsm.width/w/2, j*fsm.height/h-fsm.height/h/2]);
            }
          }
          candidatesList = _.shuffle(candidatesList);
          return candidatesList;
        }

        var candidates = getCandidates(3,3);

        var places = chance.pick(candidates, 2+this.puzzlesCompleted);

        // console.log(places[0], places[1]);
        console.log(places);

        this.handle('draw-puzzle', places);

      },

      'draw-puzzle': function (places) {
        var fsm = this;
        console.log("Drawing the puzzle", places);

        this.svg.selectAll('.node').remove();

        var next_circle = 0;
        var nodeGroup = this.svg.selectAll('g.node')
            .data(places)
            .enter()
            .append('g')
            .classed('node', true)
            .on('mouseover', function (d, i) {
              if (i === next_circle) {
                d3.select(this).classed('selected', true);
                next_circle++;
              } else if (i > next_circle) {
                console.log("Incorrect, redraw");
                fsm.handle('configure-puzzle');
              }

              console.log('next_circle, places.length', next_circle, places.length);
              if (next_circle >= places.length) {
                console.log('Next puzzle');
                fsm.handle('finished-puzzle', places.length);
              }
            });

        nodeGroup.append('circle')
            .attr('cx', function (d) {
              return d[0];
            })
            .attr('cy', function (d) {
              return d[1];
            })
            .attr('r', 20);

        nodeGroup.append('text')
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

      'finished-puzzle': function (numDots) { //finished the current puzzle
        console.log('finished-puzzle', numDots, this.playerCount);
        this.puzzlesCompleted++;
        if (this.playerCount === numDots) {
          this.transition('puzzle-end');
        } else {
          this.handle('configure-puzzle');
        }
      },

      _onExit: function () {
        this.svg.selectAll('.node').remove();
      }
    },

    'puzzle-end': { //done with all puzzles
      _onEnter: function() {
        this.socket.emit('puzzle-end');
      },

      'got-spoon': function (msg) {
        if (msg.gotSpoon) {
          this.transition('waiting-for-game-end');
        } else {
          this.messageBox.text('YOU LOSE! You are the only loser this time');
          this.transition('game-end');
        }
      }
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
        this.pendingCardG.remove();
        this.nextCard.remove();
      }
    },

    'waiting-for-game-end': {
      _onEnter: function() {
        this.messageBox.text("YOU DIDN'T LOSE!");
      },

      _onExit: function () {
        this.messageBox.text('');
      }
    },

    'keep-card': {
      _onEnter: function() {
        console.log('keep card _onEnter', this.keepCard);

        this.hand.cards.push(this.keepCard);
        console.log(this.hand);

        var dataSelection = this.handSelection.selectAll('.card')
          .data(this.hand.cards);

        // var imageSelection = dataSelection
        dataSelection
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

        this.cardCountChange();
        this.drawHand(d3.selectAll('.card'));

        this.discardAnimate();
      }
    },

    'post-kept-animation': {
      _onEnter: function() {
        this.cardCountChange();

        var n = 0;

        this.drawHand(d3.selectAll('.card')
          .transition()
          .ease('linear')
          .duration(250)
          .each(function() {
            ++n;
          })
          .each('end', function() {
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
        .on('click', function (passCard) {
          d3.select(this).remove();

          that.socket.emit('pass', passCard);

          _.remove(that.hand.cards, function(card) {
            return card.id === passCard.id;
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
          var oldY = elem.attr('y');
          console.log(oldY);
          // give the cards 90% of the height, and split the other 10% for the spacing
          var passCardHeight = that.height * 0.8 / that.hand.cards.length;
          // var passCardSpaceHeight = (that.height * 0.2) / (that.hand.cards.length + 1);

          // set the cards' width based on their height (and the card width:height ratio)
          var passCardWidth = passCardHeight * WIDTH_TO_HEIGHT;

          var passCardX = that.width / 2 - passCardWidth / 2; // - oldX;
          // var passCardY = index * passCardHeight + passCardSpaceHeight * (index + 1); // - oldY;
          return passCardX;
        })
        .attr('y', function(theCard, index) {
          // var elem = d3.select(this);
          // var oldX = elem.attr('x');
          // console.log(oldX);
          // var oldY = elem.attr('y');
          // console.log(oldY);
          // give the cards 90% of the height, and split the other 10% for the spacing
          var passCardHeight = that.height * 0.8 / that.hand.cards.length;
          var passCardSpaceHeight = (that.height * 0.2) / (that.hand.cards.length + 1);

          // set the cards' width based on their height (and the card width:height ratio)
          // var passCardWidth = passCardHeight * WIDTH_TO_HEIGHT;

          // var passCardX = that.width / 2 - passCardWidth / 2; // - oldX;
          var passCardY = index * passCardHeight + passCardSpaceHeight * (index + 1); // - oldY;
          return passCardY;

        })
        .ease('linear')
        .duration(250);
    }.bind(this), 250);
  }
});

$(window).resize(function() {
  console.log('resizing');
  clientFsm.resize();
});
