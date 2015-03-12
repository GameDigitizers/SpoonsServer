$(function () {
  $('#ready').click(function () {
    console.log('READY!');
    socket.emit('player-ready', {ready: true});
  });
});

var socket = io();

