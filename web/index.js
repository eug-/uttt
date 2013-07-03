var express = require('express')
  , app = express()
  , http = require('http')
  , server = http.createServer(app)
  , sio = require('socket.io').listen(server)
  , port = 3700;

app.configure(function () {
    app.set('view engine', 'jade');
    app.set('view options', {layout: false});
    app.use(express.cookieParser());
    app.use(express.session({secret: 'secret', key: 'express.sid'}));
});
 
app.get('/', function (req, res) {
  res.render('index', {value: req.session.value});
});

server.listen(port);
 

sio.sockets.on('connection', function (socket) {
  socket.on('move', function (data) {
    console.log(data);
    socket.emit('move',  data );
  });
});




