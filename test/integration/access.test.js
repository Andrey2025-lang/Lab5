const { io } = require('socket.io-client');
const instance = require('../../libs/app').createChatServer({env:{}});
const server = instance.server;
let base;
beforeAll(done => { server.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${server.address().port}`; done(); }); });
afterAll(async () => { await instance.chat.close(); });
test('el chat privado exige iniciar sesión', async () => {
  const response = await fetch(`${base}/chat`, { redirect: 'manual' });
  expect(response.status).toBe(302);
  expect(response.headers.get('location')).toBe('/?login=required');
});
test('la identidad no se entrega sin sesión', async () => {
  const response = await fetch(`${base}/api/session`);
  expect(response.status).toBe(401);
});
test('socket anónimo se rechaza', done => {
  const client = io(base, { path:'/api/socket-io/socket.io', transports:['websocket'], reconnection:false });
  client.once('connect', () => { client.close(); done(new Error('Acceso anónimo permitido')); });
  client.once('connect_error', () => { client.close(); done(); });
});
