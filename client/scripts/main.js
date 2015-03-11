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

var WIDTH_TO_HEIGHT = 125/182;
var svg = d3.select('svg');
var shuffled_deck = chance.shuffle(card_files);
var hand = shuffled_deck.slice(0, 4);
var width, height;
var card_width;
var pending_card_width, pending_card_height;

var handSelection = svg.append('g')
    .attr('class', 'hand');
var newCardSelection = svg.append('g')
        .attr('class', 'pending-card');


function setup () {
    width = $('svg').width();
    height = $('svg').height();
    card_width = .2*width;
    var dataSelection = handSelection.selectAll('.card')
        .data(hand);

    dataSelection
        .enter()
        .append('svg:image')
        .attr('class', 'card')
        .attr('x', function (theCard, index) {
            return index*0.20*width + 10*(index+1);
        })
        .attr('y', height * .8)
        .attr('width', card_width)
        .attr('height', card_width/WIDTH_TO_HEIGHT)
        .attr('xlink:href', function (theCard) {
            return 'images/' + theCard;
        });

    if (width/height > WIDTH_TO_HEIGHT) {
        pending_card_height = .7*height;
        pending_card_width = pending_card_height*WIDTH_TO_HEIGHT;
    } else {
        pending_card_width = .8*width;
        pending_card_height = pending_card_width/WIDTH_TO_HEIGHT;
    }

    newCardDataSelection = newCardSelection
        .selectAll('.the-pending-card')
        .data([shuffled_deck[4]]);

    newCardDataSelection
        .enter()
        .append('svg:image')
        .attr('class', 'the-pending-card')
        .attr('x', width/2 - pending_card_width/2)
        .attr('y', .4*height - pending_card_height/2)
        .attr('width', pending_card_width)
        .attr('height', pending_card_height)
        .attr('xlink:href', function (theCard) {
            return 'images/' + theCard;
        });

}

setup();

$(window).resize(function () {
    console.log('resizing');
    width = $('svg').width();
    height = $('svg').height();
    card_width = .2*width;
    handSelection.selectAll('.card')
        .attr('x', function (theCard, index) {
            return index*0.20*width + 10;
        })
        .attr('width', card_width)
        .attr('height', card_width/WIDTH_TO_HEIGHT)

    if (width/height > WIDTH_TO_HEIGHT) {
        pending_card_height = .7*height;
        pending_card_width = pending_card_height*WIDTH_TO_HEIGHT;
    } else {
        pending_card_width = .8*width;
        pending_card_height = pending_card_width/WIDTH_TO_HEIGHT;
    }

    newCardSelection.selectAll('.the-pending-card')
        .attr('x', width/2 - pending_card_width/2)
        .attr('y', .4*height - pending_card_height/2)
        .attr('width', pending_card_width)
        .attr('height', pending_card_height);
});