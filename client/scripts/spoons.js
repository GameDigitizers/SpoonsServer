$(function () {
  $('#jump').click(function () {
    console.log('JUMP!');
    socket.emit('jump');
  });
});

var socket = io();

