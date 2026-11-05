const { createHash } = require('node:crypto');
const { Server } = require('socket.io');
const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');
const { verifyTicket } = require('./tickets');
const SOCKET_PATH = '/api/socket-io/socket.io';
function attachChatServer(server, { secret, origin, redisURL, requireRedis = false }) {
  const io = new Server(server, {
    path: SOCKET_PATH, transports:['websocket'], maxHttpBufferSize: 16384,
    allowRequest: (req, done) => done(null, Boolean(origin) && req.headers.origin === origin),
  });
  let pub, sub;
  const revoked = new Map();
  const ready = (async () => {
    if (!redisURL) { if (requireRedis) throw new Error('REDIS_REQUIRED'); return; }
    pub = createClient({url:redisURL}); sub = pub.duplicate();
    pub.on('error', () => {}); sub.on('error', () => {});
    await Promise.all([pub.connect(), sub.connect()]); io.adapter(createAdapter(pub, sub));
  })();
  // Keep failures observable through readiness, without an unhandled rejection.
  ready.catch(() => {});
  async function isRevoked(sid) {
    await ready;
    if (pub) return Boolean(await pub.get(`una-chat:revoked:${sid}`));
    const until = revoked.get(sid);
    if (until && until > Date.now()) return true;
    revoked.delete(sid); return false;
  }
  async function revoke(sid) {
    await ready;
    if (pub) await pub.set(`una-chat:revoked:${sid}`, '1', {EX:28800});
    else { for (const [key, until] of revoked) if (until <= Date.now()) revoked.delete(key); revoked.set(sid, Date.now()+28800000); }
    io.in(`session:${sid}`).disconnectSockets(true);
  }
  io.use(async (socket, next) => {
    try {
      const user = verifyTicket(socket.handshake.auth?.ticket, secret);
      if (await isRevoked(user.sid)) throw new Error('AUTH_REQUIRED');
      socket.data.user = user; next();
    } catch { next(new Error('AUTH_REQUIRED')); }
  });
  io.on('connection', socket => {
    const user = socket.data.user;
    const initialized = (async () => { try {
      await socket.join(`session:${user.sid}`);
      const revokedNow = await isRevoked(user.sid);
      if (!socket.connected || revokedNow) { socket.disconnect(true); return false; }
      await socket.join('authenticated'); return true;
    } catch { socket.disconnect(true); return false; } })();
    const expires = setTimeout(() => socket.disconnect(true), Math.max(1, user.exp*1000-Date.now())); expires.unref();
    socket.on('disconnect', () => clearTimeout(expires));
    let last = 0;
    socket.on('Evento-Mensaje-Server', async (raw, ack = () => {}) => {
      try {
        if (!await initialized) return;
        if (user.exp*1000 <= Date.now() || await isRevoked(user.sid)) return socket.disconnect(true);
        const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (!data || typeof data.mensaje !== 'string' || !data.mensaje.trim() || data.mensaje.length > 4000) return ack({error:'Mensaje inválido. Máximo 4000 caracteres.'});
        if (Date.now()-last < 250) return ack({error:'Espera un momento antes de enviar otro mensaje.'});
        last = Date.now();
        const color = '#' + createHash('sha256').update(user.sub).digest('hex').slice(0,6);
        // Broadcast raw text only. The browser constructs permitted media with DOM APIs.
        io.to('authenticated').emit('Evento-Mensaje-Server', JSON.stringify({sub:user.sub, nombre:user.name, color, mensaje:data.mensaje.trim(), at:new Date().toISOString()}));
        ack({ok:true});
      } catch { ack({error:'No se pudo enviar el mensaje.'}); }
    });
  });
  async function close() {
    await new Promise(resolve => io.close(resolve));
    await Promise.all([pub,sub].filter(Boolean).map(client => client.isOpen ? client.quit() : undefined));
  }
  return {io, ready, revoke, isRevoked, close};
}
module.exports = {attachChatServer, SOCKET_PATH};
