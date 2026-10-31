
// npm install para descargar los paquetes...

var app = require('express')();
var http = require('http').Server(app);
var attachChatServer = require('./libs/chat-server').attachChatServer;
var port = process.env.PORT || 3001;

// root: presentar html
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

attachChatServer(http);


module.exports = http;

if (process.env.NODE_ENV !== 'test') {
  http.listen(port, function(){
    console.log('listening on *:' + port);
  });
}
