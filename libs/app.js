const express = require('express');
const http = require('node:http');
const path = require('node:path');
const {createHash} = require('node:crypto');

const {attachChatServer} = require('./chat-server');
const {issueTicket} = require('./tickets');
const root = path.join(__dirname,'..');
function createChatServer({env = process.env, authMiddleware} = {}) {
  const app = express(); app.disable('x-powered-by'); app.set('trust proxy', 1);
  const baseURL = env.APP_BASE_URL || 'http://localhost:3001';
  const origin = new URL(baseURL).origin;
  const secret = env.AUTH0_SESSION_SECRET;
  const configured = Boolean(secret?.length >=32 && env.AUTH0_DOMAIN && env.AUTH0_CLIENT_ID && env.AUTH0_CLIENT_SECRET);
  const server = http.createServer(app);
  const chat = attachChatServer(server, {secret, origin, redisURL:env.REDIS_URL, requireRedis:Boolean(env.VERCEL)});
  app.use((req,res,next) => {
    res.set({'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','X-Frame-Options':'DENY',
      'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https:; frame-src https://www.youtube.com; connect-src 'self' ws: wss:; base-uri 'none'; frame-ancestors 'none'; form-action 'self' https://"+(env.AUTH0_DOMAIN || "invalid.auth0.com")+""}); next();
  });
  if (authMiddleware) app.use(authMiddleware);
  else if (configured) app.use(require('@auth0/auth0-express').createAuth0({domain:env.AUTH0_DOMAIN, clientId:env.AUTH0_CLIENT_ID, clientSecret:env.AUTH0_CLIENT_SECRET, appBaseUrl:baseURL, sessionSecret:secret, mountRoutes:false,
    sessionConfiguration:{rolling:false,absoluteDuration:28800,inactivityDuration:28800,cookie:{sameSite:'lax',secure:origin.startsWith('https:')}}}));
  async function session(req) {
    const data = await req.auth0?.client.getSession();
    if (!data?.user?.sub || !data.idToken) return null;
    const sid = createHash('sha256').update(data.idToken).digest('hex');
    if (await chat.isRevoked(sid)) return null;
    return {user:data.user,sid};
  }
  async function requireSession(req,res,next) {
    try { req.chatSession = await session(req); if (req.chatSession) return next();
      if (req.path === '/chat') return res.redirect('/?login=required');
      res.status(401).json({error:'Inicia sesión para continuar.'});
    } catch { res.status(503).json({error:'No se pudo comprobar tu sesión. Inténtalo de nuevo.'}); }
  }
  function sameOrigin(req,res,next) { if (req.headers.origin !== origin) return res.status(403).json({error:'Solicitud no permitida.'}); next(); }
  app.get('/health', async (req,res) => { try { await chat.ready; res.status(configured || authMiddleware ? 200:503).json({ready:Boolean(configured || authMiddleware)}); } catch {res.status(503).json({ready:false});} });
  app.get('/', async (req,res,next) => { try { if (!req.query.error && await session(req)) return res.redirect('/chat'); res.sendFile(path.join(root,'login.html')); } catch {next(new Error('AUTH_ERROR'));} });
  app.get('/auth/login', async (req,res,next) => {
    if (!req.auth0) return res.redirect('/?error=configuration');
    try { const url = await req.auth0.client.startInteractiveLogin({appState:{returnTo:'/chat'},authorizationParams:{redirect_uri:origin+'/auth/callback',scope:'openid profile email'}}); res.redirect(url.href); } catch {next(new Error('AUTH_ERROR'));}
  });
  app.get('/auth/callback', async (req,res,next) => {
    if (!req.auth0) return res.redirect('/?error=configuration');
    try { await req.auth0.client.completeInteractiveLogin(new URL(req.originalUrl, origin)); res.redirect('/chat'); } catch {next(new Error('AUTH_ERROR'));}
  });
  app.get('/auth/logout', (req,res) => res.redirect('/chat'));
  app.post('/auth/logout', sameOrigin, requireSession, async (req,res,next) => {
    try { await chat.revoke(req.chatSession.sid); const url = await req.auth0.client.logout({returnTo:origin}); res.redirect(303,url.href); } catch {next(new Error('AUTH_ERROR'));}
  });
  app.get('/chat', requireSession, (req,res) => res.sendFile(path.join(root,'index.html')));
  app.get('/api/session', requireSession, (req,res) => res.json({sub:req.chatSession.user.sub,name:req.chatSession.user.name || req.chatSession.user.nickname || 'Usuario'}));
  app.post('/api/socket-ticket', sameOrigin, requireSession, (req,res) => res.json({ticket:issueTicket(req.chatSession.user,req.chatSession.sid,secret)}));
  app.get('/socket.io.min.js', (req,res) => res.sendFile(path.join(path.dirname(require.resolve('socket.io/package.json')),'client-dist/socket.io.min.js')));
  app.get('/chat.js', requireSession, (req,res) => res.sendFile(path.join(root,'public/chat.js')));
  app.get('/login.js', (req,res) => res.sendFile(path.join(root,'public/login.js')));
  app.use((err,req,res,next) => { if (res.headersSent) return next(err); res.redirect('/?error=authentication'); });
  return {app,server,chat};
}
module.exports = {createChatServer};
