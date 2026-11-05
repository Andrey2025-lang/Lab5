require('dotenv').config({quiet:true});
const {createChatServer} = require('./libs/app');
const instance = createChatServer();
module.exports = instance.server;
module.exports.instance = instance;
if (require.main === module) instance.server.listen(process.env.PORT || 3001, () => console.log('UNA Chat listo en el puerto '+(process.env.PORT || 3001)));
