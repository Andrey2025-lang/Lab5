const {io} = require('socket.io-client');
const {createChatServer} = require('../../libs/app');
const {issueTicket} = require('../../libs/tickets');
const secret='test-only-session-secret-with-at-least-32-characters';
const origin='http://localhost:3001';
let instance, base;
const clients=[];
function authMiddleware(req,res,next) {
  req.auth0={client:{
    getSession:async () => req.headers.cookie === 'test-session=alice' ? {user:{sub:'github|alice',name:'Alice'},idToken:'test-alice-token'} : undefined,
    logout:async () => new URL(origin),
    completeInteractiveLogin:async () => {throw new Error('access_denied: private provider detail');},
  }}; next();
}
async function connect(ticket) {
  const socket=io(base,{path:'/api/socket-io/socket.io',transports:['websocket'],forceNew:true,reconnection:false,extraHeaders:{Origin:origin},auth:{ticket}});
  clients.push(socket);
  return new Promise((resolve,reject) => {socket.once('connect',()=>resolve(socket));socket.once('connect_error',reject);});
}
async function ticket() {
  const response=await fetch(base+'/api/socket-ticket',{method:'POST',headers:{Origin:origin,Cookie:'test-session=alice'}});
  expect(response.status).toBe(200); return (await response.json()).ticket;
}
beforeAll(async () => {
  instance=createChatServer({env:{AUTH0_SESSION_SECRET:secret,APP_BASE_URL:origin},authMiddleware});
  await new Promise(resolve => instance.server.listen(0,'127.0.0.1',resolve)); base=`http://127.0.0.1:${instance.server.address().port}`;
});
afterAll(async () => {clients.forEach(socket=>socket.close());await instance.chat.close();});
test('la sesión devuelve identidad mínima sin secretos ni tokens',async () => {
  const response=await fetch(base+'/api/session',{headers:{Cookie:'test-session=alice'}});
  expect(await response.json()).toEqual({sub:'github|alice',name:'Alice'});
  expect(response.headers.get('cache-control')).toBe('no-store');
});
test('página privada y recursos exigen sesión',async () => {
  expect((await fetch(base+'/chat',{headers:{Cookie:'test-session=alice'}})).status).toBe(200);
  expect((await fetch(base+'/chat.js',{redirect:'manual'})).status).toBe(401);
  expect((await fetch(base+'/chat.js',{headers:{Cookie:'test-session=alice'}})).status).toBe(200);
});
test('ticket no se emite sin sesión ni desde otro origen',async () => {
  expect((await fetch(base+'/api/socket-ticket',{method:'POST',headers:{Origin:origin}})).status).toBe(401);
  expect((await fetch(base+'/api/socket-ticket',{method:'POST',headers:{Origin:'https://otro.example',Cookie:'test-session=alice'}})).status).toBe(403);
});
test('socket sin credencial, alterado y expirado se rechazan',async () => {
  await expect(connect(undefined)).rejects.toThrow('AUTH_REQUIRED');
  await expect(connect((await ticket())+'x')).rejects.toThrow('AUTH_REQUIRED');
  await expect(connect(issueTicket({sub:'github|alice',name:'Alice'},'sid',secret,Date.now()-61000))).rejects.toThrow('AUTH_REQUIRED');
});
test('dos clientes reciben mensaje con identidad del servidor aunque se falsifique nombre',async () => {
  const token=await ticket(); const first=await connect(token); const second=await connect(token);
  const received=new Promise(resolve=>second.once('Evento-Mensaje-Server',raw=>resolve(JSON.parse(raw))));
  first.emit('Evento-Mensaje-Server',JSON.stringify({nombre:'Administrador',sub:'otro',color:'#ffffff',mensaje:'Hola comunidad'}));
  expect(await received).toMatchObject({nombre:'Alice',sub:'github|alice',mensaje:'Hola comunidad'});
  first.close();second.close();
});
test('texto HTML se transmite como datos, no se convierte en HTML ejecutable',async () => {
  const client=await connect(await ticket());
  const received=new Promise(resolve=>client.once('Evento-Mensaje-Server',raw=>resolve(JSON.parse(raw))));
  client.emit('Evento-Mensaje-Server',JSON.stringify({mensaje:'<img src=x onerror=alert(1)>'}));
  expect((await received).mensaje).toBe('<img src=x onerror=alert(1)>');client.close();
});
test('límite de mensaje se aplica en servidor',async () => {
  const client=await connect(await ticket());
  const result=await new Promise(resolve=>client.emit('Evento-Mensaje-Server',{mensaje:'a'.repeat(4001)},resolve));
  expect(result.error).toContain('4000');client.close();
});
test('logout requiere origen y revoca ticket y sockets activos',async () => {
  const token=await ticket();const client=await connect(token);
  const disconnected=new Promise(resolve=>client.once('disconnect',resolve));
  expect((await fetch(base+'/auth/logout',{method:'POST',headers:{Origin:'https://otro.example',Cookie:'test-session=alice'},redirect:'manual'})).status).toBe(403);
  const response=await fetch(base+'/auth/logout',{method:'POST',headers:{Origin:origin,Cookie:'test-session=alice'},redirect:'manual'});
  expect(response.status).toBe(303);await disconnected;
  await expect(connect(token)).rejects.toThrow('AUTH_REQUIRED');
  expect((await fetch(base+'/api/session',{headers:{Cookie:'test-session=alice'}})).status).toBe(401);
});

test('callback cancelado se redirige a error genérico sin exponer datos del proveedor',async()=>{
 const response=await fetch(base+'/auth/callback?error=access_denied&error_description=private',{redirect:'manual'});
 expect(response.status).toBe(302);expect(response.headers.get('location')).toBe('/?error=authentication');
 const page=await fetch(base+response.headers.get('location'));expect(page.status).toBe(200);expect(await page.text()).not.toContain('private provider detail');
});
test('cliente Socket.IO se sirve con JavaScript, sin redirecciones',async()=>{
 const response=await fetch(base+'/socket.io.min.js',{redirect:'manual'});expect(response.status).toBe(200);expect(response.headers.get('content-type')).toMatch(/javascript/);expect((await response.text()).length).toBeGreaterThan(1000);
});
