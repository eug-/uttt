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

io.sockets.on('connection', function (socket) {
  console.log('CONNECTION MADE');
  socket.on('move', function (data) {
    console.log(data);
    io.sockets.emit('move',  data );
  });
});




