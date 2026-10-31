const { Server } = require('socket.io');
const validation = require('./unalib');

const SOCKET_PATH = '/api/socket-io/socket.io';

function attachChatServer(httpServer) {
  const io = new Server(httpServer, {
    path: SOCKET_PATH,
  });

  io.on('connection', (socket) => {
    socket.on('Evento-Mensaje-Server', (msg) => {
      const validatedMessage = validation.validateMessage(msg);
      io.emit('Evento-Mensaje-Server', validatedMessage);
    });
  });

  return io;
}

module.exports = { attachChatServer, SOCKET_PATH };
