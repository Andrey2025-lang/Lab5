const http = require('http');
const { attachChatServer } = require('../libs/chat-server');

const server = http.createServer();
attachChatServer(server);

module.exports = server;
