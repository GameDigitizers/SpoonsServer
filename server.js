var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

var chromecast;

io.on('connection', function(socket){
  console.log('CONNECTED');
  
  socket.on('i_am_chromecast', function(msg){
    console.log("SOMEONE CLAIMS TO BE A CHROMECAST");
    chromecast = socket;
  });

  socket.on('jump', function (socket) {
      chromecast.emit('jump');
  });
});

app.use(express.static(__dirname + '/receiver'));
app.use(express.static(__dirname + '/client'));
app.use(express.static(__dirname + '/sender'));

http.listen(3339, function(){
  console.log('listening on *:3339');
});
