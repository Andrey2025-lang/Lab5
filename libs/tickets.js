const { createHmac, timingSafeEqual } = require('node:crypto');
const sign = (text, secret) => createHmac('sha256', secret).update('una-chat-ticket:' + text).digest('base64url');
function issueTicket(user, sid, secret, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ sub:user.sub, name:user.name || user.nickname || 'Usuario', sid, exp:Math.floor(now/1000)+60 })).toString('base64url');
  return `${payload}.${sign(payload, secret)}`;
}
function verifyTicket(ticket, secret, now = Date.now()) {
  if (typeof ticket !== 'string' || ticket.length > 4096 || !secret) throw new Error('AUTH_REQUIRED');
  const [payload, signature, extra] = ticket.split('.');
  if (!payload || !signature || extra) throw new Error('AUTH_REQUIRED');
  const expected = Buffer.from(sign(payload, secret));
  const actual = Buffer.from(signature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error('AUTH_REQUIRED');
  const user = JSON.parse(Buffer.from(payload, 'base64url').toString());
  if (typeof user.sub !== 'string' || !user.sub || typeof user.name !== 'string' || typeof user.sid !== 'string' || !Number.isFinite(user.exp) || user.exp <= Math.floor(now/1000)) throw new Error('AUTH_REQUIRED');
  return user;
}
module.exports = { issueTicket, verifyTicket };
