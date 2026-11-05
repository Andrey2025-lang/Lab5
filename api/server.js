// Vercel supports an exported HTTP server for WebSocket upgrades.
require('dotenv').config({quiet:true});
module.exports = require('../libs/app').createChatServer().server;
