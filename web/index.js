var express = require('express')
  , app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server)
  , port = 3700;

app.configure(function () {
    app.set('view engine', 'ejs');
    app.engine('html', require('ejs').renderFile);
    app.set('view options', {layout: false});
    app.use(express.cookieParser());
    app.use(express.session({secret: 'secret', key: 'express.sid'}));
});
 
/*
app.get('/', function (req, res) {
  res.render('index.html', {value: req.session.value});
});
*/

server.listen(port);
var game;

io.sockets.on('connection', function (socket) {
  if (!game) {
    game = new Game();
  }
  game.addClient(socket);
});



var Game = function () {
  // TODO: Unique ids.
  this.id = 'room';
  this.clients = {};
  this.moves = [];
  this.connectedClients = 0;
};


Game.MAX_CONNECTIONS = 2;


Game.prototype.addClient = function (socket) {
  var client = {
    player: this.connectedClients
  };

  // Add a participating player.
  if (this.connectedClients < Game.MAX_CONNECTIONS) {
    this.connectedClients++;
    this.clients[socket.id] = client;
    this.addSocketListeners(socket);
  }

  socket.join(this.id);
  socket.emit('init', {
    player: client.player,
    moves: this.moves
  });
};


Game.prototype.verifyMove = function (client, move) {
  if (move.player != client.player) {
    // Player sending the request did not match the client.
    return false;
  }
  if (this.moves.length &&
      this.moves[this.moves.length - 1].player == move.player) {
    // Player attempting to make a second move in a row.
    // TODO: Create an 'activePlayer' property and verify against
    // that instead.
    return false;
  }
  return true;
};


Game.prototype.addSocketListeners = function (socket) {
  socket.on('move', (function (data) {
    if (this.verifyMove(this.clients[socket.id], data)) {
      this.moves.push(data);
      io.sockets.in(this.id).emit('move',  data);
    }
  }).bind(this));

  socket.on('disconnect', (function () {
    if (this.clients[socket.id]) {
      delete this.clients[socket.id];
      this.connectedClients--;

      // Delete game if no player is connected.
      if (this.connectedClients <= 0) {
        game = null;
      }
    }
  }).bind(this));
};
