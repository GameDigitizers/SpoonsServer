
var castMachine = new machina.Fsm({
  initialize: function () {
    this.socket = io();

    this.socket.on('chat message', function(msg){
      console.log("CHAT MESSAGE");
      console.log(msg);
    });

    this.socket.emit('i_am_chromecast', {
      gameId: window.location.hash,
    });

    this.socket.on('new-player', function (msg) {
      castMachine.handle('new-player', msg);
    })
  },

  namespace: 'chromecast',
  initialState: 'lobby',

  states: {
    'lobby': {
      _onEnter: function () {
                
      },

      'new-player': function (msg) {
        console.log("need to draw a ", msg.avatar);
      }
    },
  },

  startMeUp: function () {
    this.transition('lobby');
  }
});

castMachine.startMeUp();


// var card_files = [
//     "10_of_clubs.png",
//     "10_of_diamonds.png",
//     "10_of_hearts.png",
//     "10_of_spades.png",
//     "2_of_clubs.png",
//     "2_of_diamonds.png",
//     "2_of_hearts.png",
//     "2_of_spades.png",
//     "3_of_clubs.png",
//     "3_of_diamonds.png",
//     "3_of_hearts.png",
//     "3_of_spades.png",
//     "4_of_clubs.png",
//     "4_of_diamonds.png",
//     "4_of_hearts.png",
//     "4_of_spades.png",
//     "5_of_clubs.png",
//     "5_of_diamonds.png",
//     "5_of_hearts.png",
//     "5_of_spades.png",
//     "6_of_clubs.png",
//     "6_of_diamonds.png",
//     "6_of_hearts.png",
//     "6_of_spades.png",
//     "7_of_clubs.png",
//     "7_of_diamonds.png",
//     "7_of_hearts.png",
//     "7_of_spades.png",
//     "8_of_clubs.png",
//     "8_of_diamonds.png",
//     "8_of_hearts.png",
//     "8_of_spades.png",
//     "9_of_clubs.png",
//     "9_of_diamonds.png",
//     "9_of_hearts.png",
//     "9_of_spades.png",
//     "ace_of_clubs.png",
//     "ace_of_diamonds.png",
//     "ace_of_hearts.png",
//     "ace_of_spades2.png",
//     "jack_of_clubs2.png",
//     "jack_of_diamonds2.png",
//     "jack_of_hearts2.png",
//     "jack_of_spades2.png",
//     "king_of_clubs2.png",
//     "king_of_diamonds2.png",
//     "king_of_hearts2.png",
//     "king_of_spades2.png",
//     "queen_of_clubs2.png",
//     "queen_of_diamonds2.png",
//     "queen_of_hearts2.png",
//     "queen_of_spades2.png"];

// function board(context) {
//   this.mContext = context;

//   this.setup = function () {
//     console.log("SETTING UP BOARD");


//     var socket = io();
//     socket.on('chat message', function(msg){
//       console.log("CHAT MESSAGE");
//       console.log(msg);
//     });

//     socket.on('jump', function () {
//       jump();
//     })

//     console.log("Waiting for connect");
//     socket.on('connect', function () {
//       console.log('Emitting chromecast');
//       socket.emit('i_am_chromecast');
//     });

//     socket.on('new-player', function (message) {
//       console.log("Just got word of a new player with avatar ", message.avatar);
//     });

//     socket.on('transition-to-table', function () {
//       console.log("time to play");
//     });

//     var svg = d3.select('svg');

//     // These are the size of the screen
//     var width = $('svg').width();
//     var height = $('svg').height();

//     var potential_players = [
//       { name: 'Dominick Quigley',           avatar: 'bear.png'      },
//       { name: 'Lyndia Steuber',             avatar: 'beaver.png'    },
//       { name: 'Mrs. Suzanne Stanton',       avatar: 'bee.png'       },
//       { name: 'Zina Buckridge',             avatar: 'chicken.png'   },
//       { name: 'Miley Tromp MD',             avatar: 'cow.png'       },
//       { name: 'Roderic Considine',          avatar: 'dog.png'       },
//       { name: 'Tierra Witting MD',          avatar: 'elephant.png'  },
//       { name: 'Dr. Hayden Lockman',         avatar: 'giraffe.png'   },
//       { name: 'Rhonda Cormier',             avatar: 'goat.png'      },
//       { name: 'Tod Heller',                 avatar: 'hippo.png'     },
//       { name: 'Jesenia Rogahn',             avatar: 'owl.png'       },
//       { name: 'Mr. Reinhold Schmidt DDS',   avatar: 'penguin.png'   },
//       { name: 'Dawson Rohan',               avatar: 'pig.png'       },
//       { name: 'Burney OKon',                avatar: 'sheep.png'     },
//       { name: 'Mack Koch',                  avatar: 'turkey.png'    },
//       { name: 'Trina Friesen',              avatar: 'zebra.png'     }
//     ]

//     var number_of_players = chance.integer({min: 3, max: potential_players.length});
//     var players = chance.shuffle(potential_players).slice(0, number_of_players)

//     // Margins set at 5%
//     var x_margin = width * .05;
//     var y_margin = height * .05;

//     // Double the margin, and subtract from the width and height
//     var playable_area_width = width - (2 * x_margin);
//     var playable_area_height = height - (2 * y_margin);

//     var card_width = 30;
//     var card_height = 50;

//     var min_avatar_height = 125;
//     var max_avatar_height = 250;
//     // adjust the avatar size based on the number of players
//     // check for the maximum size
//     var avatar_size = d3.max([min_avatar_height, (playable_area_height/players.length)]);
//     // check for the minimum size
//     avatar_size = d3.min([avatar_size, max_avatar_height]);
    
//     // This are the radii of the ellipse
//     var y_radius = (playable_area_height - avatar_size) / 2;
//     var x_radius = (playable_area_width - avatar_size) / 2;
//     // This are the radii of the Inner Ellipse
//     var inner_y_radius = y_radius - (avatar_size/2);
//     var inner_x_radius = x_radius - (avatar_size/2);
    
//     var ellipse= {
//       x: x_margin + (avatar_size/2) + x_radius,
//       y: y_margin + (avatar_size/2) + y_radius
//     };
    
//     var spoon_size = 30;
//     var spoon_buffer = spoon_size + 30;

//     calculatePlayerInfo();

//     // make the avatars
//     var personSelection = svg.selectAll('.avatar')
//       .data(players)
//       .enter()
//         .append('g')
//           .attr('class', 'person')

//     personSelection
//       .append('svg:image')
//       .attr('class', 'avatar')
//       .attr('id', function(player, index) {
//         return 'player_' + index;
//       })
//       .attr('x', function (player, index) {
//         // x_radius * cos(Theta)
//         return (x_radius * Math.cos( (index) / players.length * 2 * Math.PI) ) + (width/2) - (avatar_size/2) ;
//       })
//       .attr('y', function (player, index) {
//         // y_radius * sin(Theta)
//         return (y_radius * Math.sin((index) / players.length * 2 * Math.PI)) + (height/2) - (avatar_size/2);
//       })
//       .attr('width', avatar_size)
//       .attr('height', avatar_size)
//       .attr('xlink:href', function (player) {
//         return 'images/' + player.avatar;
//       })

//     personSelection
//       .append('g')
//         .attr('class', 'card-stack')
//           .append('svg:image')
//             .attr('x', function (person, index) {
//               // x_radius * cos(Theta)
//               return person.card_pile_location.x ;
//             })
//             .attr('y', function (person, index) {
//               // y_radius * sin(Theta)
//               return person.card_pile_location.y;
//             })
//             .attr('width', card_width)
//             .attr('height', card_height)
//             .attr('xlink:href', function (player) {
//               return 'images/blueGrid.png';
//             })

//     personSelection
//       .append('text')
//         .attr('class', 'name')
//         .attr('x', function (person, index) {
//           // x_radius * cos(Theta)
//           return ((x_radius + avatar_size/1.5) * Math.cos( (index) / players.length * 2 * Math.PI) ) + (width/2) -avatar_size*.35 ;
//         })
//         .attr('y', function (person, index) {
//           // y_radius * sin(Theta)
//           return ((y_radius + avatar_size/1.5) * Math.sin((index) / players.length * 2 * Math.PI)) + (height/2) ;
//         })
//         .text( function (person, index) {
//           return person.name;
//         })
//         .attr('font-family', 'sans-serif')
//         .attr('font-size', '25px')
//         .attr('stroke', 'black')
//         .attr('stroke-width', '2px')
//         .attr('fill', 'white');


//     var spoons = [];
//     for (i=0; i < players.length-1; i++) {
//       spoons.push({});
//     }

//     var spoon_g = svg.selectAll('.spoon')
//         .data(spoons)
//         .enter()
//       .append("g")
//         .attr('class', 'spoon')
//         .attr("transform", "translate(" + (width / 2 - 25/2) + "," + (height / 2 - 25/2) + ")")
//         .each(caroom);
    
//     spoon_g.append("svg:image")
//         .attr('width', spoon_size)
//         .attr('height', spoon_size)
//         .attr('xlink:href', 'images/spoon.png')
//       .append('animateTransform')
//         .attr('attributeName', "transform")
//         .attr('type', "rotate")
//         .attr('from', function () {
//           return (true ? '0' : '360') + " 15 15";
//         })
//         .attr('to', function () {
//           return (true ? '360' : '0') + " 15 15";
//         })
//         .attr('dur', function () {
//           return chance.natural({min:0.5, max: 3}) + 's';
//         })
//         .attr('repeatCount', "indefinite");

//     function jump(){
//       var jumpHeight = 30;
//       var originalY = d3.select('#player_0').attr('y');

//       d3.select('#player_0')
//         .transition()
//           .attr('y', originalY - jumpHeight  )    
//           .ease('linear')
//           .duration(1000)
//           .each('end',function() {          
//             d3.select(this)
//               .transition()                  
//               .attr('y', originalY )    
//               .duration(1000);         
//            });
//     };

//     function passLeft(){
//       d3.selectAll('.person g image')
//         .each(function(d, i, array){
//           console.log(this);
//           d3.select(this)
//             .transition()
//             .attr('x', function(){
//               return players[ d3.min([ (i+1), players.length-1 ]) ].card_pile_location.x;     
//             })
//             .attr('y', function(){
//               return players[ d3.min([ (i+1), players.length-1 ]) ].card_pile_location.y;    
//             })
//             .ease('linear')
//             .duration(1000);
//         })
//     };
//     window.pl = passLeft();
    
//     function calculatePlayerInfo(){
//       players.forEach(function(player, index, array){
//         card_pile_location = {}
//         card_pile_location.x = ((x_radius - avatar_size) * Math.cos( (index) / array.length * 2 * Math.PI) ) + (width/2) - (card_width/2);
//         card_pile_location.y = ((y_radius - avatar_size) * Math.sin((index) / array.length * 2 * Math.PI)) + (height/2) - (card_height/2);
//         player.card_pile_location = card_pile_location;
//       }, this);
//     };

//     function randomInnerPath(){
//       var theta =  chance.natural({ min:0, max:2*Math.PI });
//       str = 'translate(' +
//            // x location of a random point on the inner ellipse, accounting for spoon size and the buffer
//            ( ( (inner_x_radius - spoon_buffer) * Math.cos( theta ) ) + (width/2) - spoon_size ) +
//            ',' + 
//            // y location of a random point on the inner ellipse, accounting for spoon size and the buffer
//            ( ( (inner_y_radius - spoon_buffer) * Math.sin( theta ) ) + (height/2) - spoon_size ) +
//            ')';
//       return str;
//     };

//     function caroom () {
//       d3.select(this).transition()
//         .attr('transform', randomInnerPath)
//         .ease('linear')
//         .duration(function () {
//           return chance.integer({min: 1500, max: 2500});
//         })
//         .each('end', caroom);
//     }

//     function random_x () {
//       return chance.integer({min: 0, max: width});
//     }

//     function random_y () {
//       return chance.integer({min: 0, max: height});
//     }

//   }

// }
// Helper code
  // // Make the center
  // avatar_g
  //     .append('circle')
  //     .attr('class', 'point')
  //     .attr('cx', ellipse.x)
  //     .attr('cy', ellipse.y)
  //     .attr('r', 5);
  // // Make the circles
  // avatar_g.selectAll('.b')
  //   .data(avatars)
  //   .enter()
  //     .append('circle')
  //     .attr('class', 'point')
  //     .attr('cx', function (avatar, index) {
  //       // x_radius * cos(Theta)
  //       return (x_radius * Math.cos( (index) / avatars.length * 2 * Math.PI) ) + (width/2) ;
  //     })
  //     .attr('cy', function (avatar, index) {
  //       // y_radius * sin(Theta)
  //       return (y_radius * Math.sin((index) / avatars.length * 2 * Math.PI)) + (height/2);
  //     })
  //     .attr('r', 5);
  // Make the lines
  // Based on 0,0
  // avatar_g
  //   .append('line')
  //   .attr('class', 'line')
  //   .attr('x1', x_margin )
  //   .attr('x2', x_margin + inner_x_radius*2 )
  //   .attr('y1', y_margin + inner_y_radius )
  //   .attr('y2', y_margin + inner_y_radius )
  //   .attr('stroke', 'black' )
  //   .attr('stroke-width', 3);
  // avatar_g
  //   .append('line')
  //   .attr('class', 'line')
  //   .attr('x1', x_margin + inner_x_radius )
  //   .attr('x2', x_margin + inner_x_radius )
  //   .attr('y1', y_margin )
  //   .attr('y2', y_margin + inner_y_radius*2 )
  //   .attr('stroke', 'black' )
  //   .attr('stroke-width', 3);

  // // Based on the center of the inner ellipsis
  // avatar_g
  //   .append('line')
  //   .attr('class', 'line')
  //   .attr('x1', ellipse.x - inner_x_radius  )
  //   .attr('x2', ellipse.x + inner_x_radius  )
  //   .attr('y1', ellipse.y )
  //   .attr('y2', ellipse.y )
  //   .attr('stroke', 'black' )
  //   .attr('stroke-width', 3);
  // avatar_g
  //   .append('line')
  //   .attr('class', 'line')
  //   .attr('x1', ellipse.x  )
  //   .attr('x2', ellipse.x  )
  //   .attr('y1', ellipse.y - inner_y_radius )
  //   .attr('y2', ellipse.y + inner_y_radius)
  //   .attr('stroke', 'black' )
  //   .attr('stroke-width', 3);