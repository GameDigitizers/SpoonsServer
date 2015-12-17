
var min_avatar_height = 125;
var max_avatar_height = 250;

var castMachine = new machina.Fsm({
  initialize: function () {
    this.socket = io();
    this.players = [];
    this.svg = d3.select('svg');

    this.socket.emit('i_am_chromecast', {
      gameId: '#42', //window.location.hash,
    });

    this.registerMessage('new-player');
    this.registerMessage('play');
    this.registerMessage('pass');
    this.registerMessage('take-spoon');
    this.registerMessage('game-end');
  },

  registerMessage: function (msgType) {
    this.socket.on(msgType, function (msg) {
      castMachine.handle(msgType, msg);
    });
  },

  namespace: 'chromecast',
  initialState: 'lobby',

  states: {
    'lobby': {
      _onEnter: function () {
        this.handle('reflow-players');
      },

      'new-player': function (msg) {
        console.log("need to draw a ", msg);

        var player = {
          avatar: msg.avatar,
          playerId: msg.playerId,
          number: this.players.length,
        };

        this.players.push(player);
        this.handle('reflow-players');

      },

      play: function () {
        this.transition('table');
      },

      'reflow-players': function () {
        console.log('reflow-players');
        this.reflow();

        var personSelection = this.svg.selectAll('.avatar')
          .data(this.players)
          .enter()
            .append('g')
            .attr('id', function(player, index) {
              return 'player_' + index;
            })
            .attr('class', 'person')
            .append('svg:image')
            .attr('class', 'avatar')
            .attr('xlink:href', function (player) {
              return 'images/' + player.avatar;
            })
            .attr('width', 1)
            .attr('height', 1)
            .on('load', function () {
              console.log("image is here");
              d3.select(this)
                .attr('x', function (player, index) {
                  return castMachine.playable_area_width / 2;
                })
                .attr('y', function (player, index) {
                  return castMachine.playable_area_height / 2;
                })
                .attr('width', 0)
                .attr('height', 0)
                .transition()
                .attr('x', function (player, index) {
                  return (castMachine.x_radius * Math.cos(player.number / castMachine.players.length * 2 * Math.PI)) + (castMachine.width/2) - (castMachine.avatar_size/2) ;
                })
                .attr('y', function (player, index) {
                  return (castMachine.y_radius * Math.sin(player.number / castMachine.players.length * 2 * Math.PI)) + (castMachine.height/2) - (castMachine.avatar_size/2);
                })
                .attr('width', castMachine.avatar_size)
                .attr('height', castMachine.avatar_size);
            });

        this.svg.selectAll('.avatar')
          .transition()
          .attr('x', function (player, index) {
            player.x = (castMachine.x_radius * Math.cos(index / castMachine.players.length * 2 * Math.PI)) + (castMachine.width/2) - (castMachine.avatar_size/2) ;
            return player.x;
          })
          .attr('y', function (player, index) {
            player.y = (castMachine.y_radius * Math.sin(index / castMachine.players.length * 2 * Math.PI)) + (castMachine.height/2) - (castMachine.avatar_size/2);
            return player.y;
          })
          .attr('width', this.avatar_size)
          .attr('height', this.avatar_size);

      }
    },

    'table': {
      _onEnter: function () {
        d3.select('#player_0')
          .append('svg:image')
          .classed('card-stack', true)
          .attr('x', function (player) {
            return player.x + castMachine.avatar_size / 2;
          })
          .attr('y', function (player) {
            return player.y + castMachine.avatar_size;
          })
          .attr('width', this.card_width)
          .attr('height', this.card_height)
          .attr('xlink:href', function (player) {
            return 'images/blueGrid.png';
          });

        this.spoons = [];
        for (i=0; i < this.players.length-1; i++) {
          this.spoons.push({});
        }

        var spoon_g = this.svg.selectAll('.spoon')
            .data(this.spoons)
            .enter()
          .append("g")
            .attr('class', 'spoon')
            .attr("transform", "translate(" + (this.width / 2 - 25/2) + "," + (this.height / 2 - 25/2) + ")")
            .each(this.caroom);
        
        spoon_g.append("svg:image")
            .attr('width', this.spoon_size)
            .attr('height', this.spoon_size)
            .attr('xlink:href', 'images/spoon.png')
          .append('animateTransform')
            .attr('attributeName', "transform")
            .attr('type', "rotate")
            .attr('from', function () {
              return (true ? '0' : '360') + " 15 15";
            })
            .attr('to', function () {
              return (true ? '360' : '0') + " 15 15";
            })
            .attr('dur', function () {
              return chance.natural({min:0.5, max: 3}) + 's';
            })
            .attr('repeatCount', "indefinite");
      },

      pass: function (msg) {
        console.log('pass', msg);

        var player = _.findWhere(this.players, {playerId: msg.player});
        var nextPlayer = _.findWhere(this.players, {playerId: msg.nextPlayer});
        console.log(player, 'passes to', nextPlayer);

      },

      'game-end': function (msg) {
        this.loser = msg.loser;
        this.transition('game-end');
      },

      'take-spoon': function (msg) {
        console.log('need to remove a spoon', msg);

        this.spoons = this.spoons.splice(0, 1);

        this.svg.select('.spoon').remove();
      },

      _onExit: function () {
        console.log("leaving play state");
      }
    },

    'game-end': {
      _onEnter: function () {
        console.log("in game-end state");

        var loser = _.findWhere(this.players, {avatar: this.loser});
        this.loserSel = d3.select('#player_' + loser.number + ' image');

        this.loserX = this.loserSel.attr('x');
        this.loserY = this.loserSel.attr('y');
        
        this.loserSel
          .transition()
          .attr('x', this.width / 2 - this.avatar_size / 2)
          .attr('y', this.height / 2 - this.avatar_size / 2);

        this.message = this.svg.append('text')
          .attr('x', this.width / 2 - 50)
          .attr('y', this.height / 2 + this.avatar_size / 2 + 15)
          .text('LOSER!');
      },

      play: function () {
        this.transition('table');
      },

      _onExit: function () {
        this.message.remove();

        this.loserSel
          .transition()
          .attr('x', this.loserX)
          .attr('y', this.loserY);
      }
    }
  },

  reflow: function () {
    this.width = $('svg').width();
    this.height = $('svg').height();

    // Margins set at 5%
    this.x_margin = this.width * .05;
    this.y_margin = this.height * .05;

    // Double the margin, and subtract from the width and height
    this.playable_area_width = this.width - (2 * this.x_margin);
    this.playable_area_height = this.height - (2 * this.y_margin);

    // check for the maximum size
    this.avatar_size = d3.max([this.min_avatar_height, (this.playable_area_height/this.players.length)]);
    // check for the minimum size
    this.avatar_size = d3.min([this.avatar_size, this.max_avatar_height]);

    // This are the radii of the ellipse
    this.y_radius = (this.playable_area_height - this.avatar_size) / 2;
    this.x_radius = (this.playable_area_width - this.avatar_size) / 2;

    this.inner_y_radius = this.y_radius - (this.avatar_size/2);
    this.inner_x_radius = this.x_radius - (this.avatar_size/2);

    this.card_width = 30;
    this.card_height = 50;

    this.spoon_size = 30;
    this.spoon_buffer = this.spoon_size + 30;

  },

  startMeUp: function () {
    this.transition('lobby');
  },

  // 'this' is weird down here
  caroom: function () {
    d3.select(this).transition()
      .attr('transform', castMachine.randomInnerPath)
      .ease('linear')
      .duration(function () {
        return chance.integer({min: 1500, max: 2500});
      })
      .each('end', castMachine.caroom);
  },

  randomInnerPath: function () {
    var theta =  chance.natural({ min:0, max:2*Math.PI });
    str = 'translate(' +
         // x location of a random point on the inner ellipse, accounting for spoon size and the buffer
         ( ( (castMachine.inner_x_radius - castMachine.spoon_buffer) * Math.cos( theta ) ) + (castMachine.width/2) - castMachine.spoon_size ) +
         ',' + 
         // y location of a random point on the inner ellipse, accounting for spoon size and the buffer
         ( ( (castMachine.inner_y_radius - castMachine.spoon_buffer) * Math.sin( theta ) ) + (castMachine.height/2) - castMachine.spoon_size ) +
         ')';
    return str;
  },
});

// castMachine.startMeUp();

function board(context) {
  this.context = context;

  this.setup = function () {
    castMachine.startMeUp();
  }
}

// function jump(){
//   var jumpHeight = 30;
//   var originalY = d3.select('#player_0').attr('y');

//   d3.select('#player_0')
//     .transition()
//       .attr('y', originalY - jumpHeight  )    
//       .ease('linear')
//       .duration(1000)
//       .each('end',function() {          
//         d3.select(this)
//           .transition()                  
//           .attr('y', originalY )    
//           .duration(1000);         
//        });
// function passLeft(){
//   d3.selectAll('.person g image')
//     .each(function(d, i, array){
//       console.log(this);
//       d3.select(this)
//         .transition()
//         .attr('x', function(){
//           return players[ d3.min([ (i+1), players.length-1 ]) ].card_pile_location.x;     
//         })
//         .attr('y', function(){
//           return players[ d3.min([ (i+1), players.length-1 ]) ].card_pile_location.y;    
//         })
//         .ease('linear')
//         .duration(1000);
//     })
// };
// window.pl = passLeft();