var card_files = [
    "10_of_clubs.png",
    "10_of_diamonds.png",
    "10_of_hearts.png",
    "10_of_spades.png",
    "2_of_clubs.png",
    "2_of_diamonds.png",
    "2_of_hearts.png",
    "2_of_spades.png",
    "3_of_clubs.png",
    "3_of_diamonds.png",
    "3_of_hearts.png",
    "3_of_spades.png",
    "4_of_clubs.png",
    "4_of_diamonds.png",
    "4_of_hearts.png",
    "4_of_spades.png",
    "5_of_clubs.png",
    "5_of_diamonds.png",
    "5_of_hearts.png",
    "5_of_spades.png",
    "6_of_clubs.png",
    "6_of_diamonds.png",
    "6_of_hearts.png",
    "6_of_spades.png",
    "7_of_clubs.png",
    "7_of_diamonds.png",
    "7_of_hearts.png",
    "7_of_spades.png",
    "8_of_clubs.png",
    "8_of_diamonds.png",
    "8_of_hearts.png",
    "8_of_spades.png",
    "9_of_clubs.png",
    "9_of_diamonds.png",
    "9_of_hearts.png",
    "9_of_spades.png",
    "ace_of_clubs.png",
    "ace_of_diamonds.png",
    "ace_of_hearts.png",
    "ace_of_spades2.png",
    "jack_of_clubs2.png",
    "jack_of_diamonds2.png",
    "jack_of_hearts2.png",
    "jack_of_spades2.png",
    "king_of_clubs2.png",
    "king_of_diamonds2.png",
    "king_of_hearts2.png",
    "king_of_spades2.png",
    "queen_of_clubs2.png",
    "queen_of_diamonds2.png",
    "queen_of_hearts2.png",
    "queen_of_spades2.png"];

var socket = io();

socket.emit('join-game', {game_id: 'SPOON'});

socket.on('choose-avatar', function (msg) {
    var choice = chance.pick(msg.avatars);
    console.log("I chose to be a", choice);
    socket.emit('avatar-choice', {avatar: choice});
});

socket.on('hand', function (msg) {
    console.log("I just got these cards", msg.hand);
});

var WIDTH_TO_HEIGHT = 125/182;
var svg = d3.select('svg');
// var shuffled_deck = chance.shuffle(card_files);
// var hand = shuffled_deck.slice(0, 4);
var hand = {
    cards: [
        {
            id: 'kc',
            src: "king_of_clubs2.png",
            suit: 'clubs',
            value: 'king'
        },
        {
            id: 'as',
            src: "ace_of_spades2.png",
            suit: 'spades',
            value: 'ace'
        },
        {
            id: '7d',
            src: "7_of_diamonds.png",
            suit: 'diamonds',
            value: '7'
        },
        {
            id: '3c',
            src: "3_of_clubs.png",
            suit: 'clubs',
            value: '3'
        }
    ],
    cardById: function (id) {
        for (var i=0; i<this.cards.length; i++) {
            if (this.cards[i].id === id) {
                return this.cards[i];
            }
        }
        return null;
    }
};
var pending_cards = [
    {
        id: 'qh',
        src: "queen_of_hearts2.png",
        suit: 'hearts',
        value: 'queen'
    }
];
var width, height;
var card_width, card_height;
var hand_spacing;
var pending_card_width, pending_card_height;
var dataSelection;
var handSelection = svg.append('g')
    .attr('class', 'hand');
var newCardSelection = svg.append('g')
        .attr('class', 'pending-card');


function setup () {
    width = $('svg').width();
    height = $('svg').height();
    // card_width = .2*width;
    dataSelection = handSelection.selectAll('.card')
        .data(hand.cards);

    if (width/height > WIDTH_TO_HEIGHT) {
        pending_card_height = .7*height;
        pending_card_width = pending_card_height*WIDTH_TO_HEIGHT;
        card_height = .2*height;
        card_width = card_height*WIDTH_TO_HEIGHT;
    } else {
        pending_card_width = .8*width;
        pending_card_height = pending_card_width/WIDTH_TO_HEIGHT;
        card_width = .2*width;
        card_height = card_width/WIDTH_TO_HEIGHT;
    }
    hand_spacing = (width - card_width*hand.cards.length)/(hand.cards.length+1);

    dataSelection
        .enter()
        .append('svg:image')
        .attr('id', function (theCard) {
            return theCard.id;
        })
        .attr('class', 'card')
        .attr('x', function (theCard, index) {
            return index*card_width + hand_spacing*(index+1);
        })
        .attr('y', height - card_height)
        .attr('width', card_width)
        .attr('height', card_height)
        .attr('xlink:href', function (theCard) {
            return 'images/' + theCard.src;
        });


    newCardDataSelection = newCardSelection
        .selectAll('.the-pending-card')
        .data(pending_cards);

    newCardDataSelection
        .enter()
        .append('svg:image')
        .attr('id', function (theCard) {
            return theCard.id;
        })
        .attr('class', 'the-pending-card')
        .attr('x', width/2 - pending_card_width/2)
        .attr('y', .4*height - pending_card_height/2)
        .attr('width', pending_card_width)
        .attr('height', pending_card_height)
        .attr('xlink:href', function (theCard) {
            return 'images/' + theCard.src;
        });
}

function redraw () {

    width = $('svg').width();
    height = $('svg').height();

    if (width/height > WIDTH_TO_HEIGHT) {
        pending_card_height = .7*height;
        pending_card_width = pending_card_height*WIDTH_TO_HEIGHT;
        card_height = .2*height;
        card_width = card_height*WIDTH_TO_HEIGHT;
    } else {
        pending_card_width = .8*width;
        pending_card_height = pending_card_width/WIDTH_TO_HEIGHT;
        card_width = .2*width;
        card_height = card_width/WIDTH_TO_HEIGHT;
    }
    hand_spacing = (width - card_width*hand.cards.length)/(hand.cards.length+1);
    
    handSelection.selectAll('.card')
        .attr('x', function (theCard, index) {
            return index*card_width + hand_spacing*(index+1);
        })
        .attr('y', height - card_height)
        .attr('width', card_width)
        .attr('height', card_height)


    newCardSelection.selectAll('.the-pending-card')
        .attr('x', width/2 - pending_card_width/2)
        .attr('y', .4*height - pending_card_height/2)
        .attr('width', pending_card_width)
        .attr('height', pending_card_height);

}

setup();

$(window).resize(function () {
    // console.log('resizing');
    redraw();
});

function panHandler() {

    console.log('panning');
}

// $('.the-pending-card').hammer().bind('pan', panHandler);
var hammertime = new Hammer($('.the-pending-card')[0]);
var mc = hammertime;
// var hammertime = $('.the-pending-card').hammer();
hammertime.get('swipe').set({ direction: Hammer.DIRECTION_ALL });

mc.on('swiperight', function (evt) {
    console.log('swiperight');
    console.log(evt);
    d3.select(evt.target).remove();
    // alert('swiped right');
    socket.emit('pass', pending_cards.shift());
    //remove this gesture listener
    mc.destroy();
});

mc.on('swipedown', function (evt) {

    console.log('swipedown');
    console.log(hand);
    d3.select(evt.target).remove();
    var keep_the_card = pending_cards.shift();
    socket.emit('keep', keep_the_card);
    hand.cards.push(keep_the_card);
    console.log(hand);

    //add new card to hand //FIXME:
    handSelection.selectAll('.card')
        .data(hand.cards)
        .enter()
        .append('svg:image')
        .attr('class', 'card')
        .attr('xlink:href', function (theCard) {
            return 'images/' + theCard.src;
        });

    //remove new card from pending //FIXME:
    newCardDataSelection
        .exit()
        .remove('.the-pending-card');

    // show all 5 cards at bottom
    redraw();

    // translate the 5 cards to be vertical
    // d3.selectAll('.card')
    // dataSelection
    setTimeout(function () {
        handSelection.selectAll('.card')
        .transition()
        .attr('transform', function (theCard, index) {
            console.log('translating:', theCard, index);
            var hammerTime = new Hammer($(this)[0]);
            hammerTime.on('swiperight', function (evt) {
                console.log('swiperight');
                console.log(evt);
                d3.select(evt.target).remove();
                // alert('swiped right');
                socket.emit('pass', hand.cardById(evt.target.id));
                //remove this gesture listener
                hammerTime.destroy();
                // TODO: should now put the cards back into the 4 on the bottom layout
            });
            var oldX = d3.select(this).attr('x');
            console.log(oldX);
            var oldY = d3.select(this).attr('y')
            console.log(oldY);
            // give the cards 90% of the height, and split the other 10% for the spacing
            var pass_card_height = height * .8/hand.cards.length;
            var pass_card_space_height = (height * .2)/(hand.cards.length+1);

            // set the cards' width based on their height (and the card width:height ratio)
            var pass_card_width = pass_card_height * WIDTH_TO_HEIGHT;

            var pass_card_x = width/2 - pass_card_width/2 - oldX;
            var pass_card_y = index*pass_card_height + pass_card_space_height*(index+1) - oldY;
            var returnVal = 'translate('+pass_card_x+','+pass_card_y+')';
            console.log(returnVal);
            return returnVal;
        })
        .ease('linear')
        .duration(500);
    }, 250);

    //remove this gesture listener
    mc.destroy();
    // alert('swiped down');
});

$(document).bind(
   'touchmove',
   function(e) {
     e.preventDefault();
   }
);
