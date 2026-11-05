// This test-only server has no Auth0 credentials and is never used by server.js or api/.
const {createChatServer}=require('../../libs/app');
const origin='http://localhost:3219';
const users={alice:{sub:'test|alice',name:'Alice'},bob:{sub:'test|bob',name:'Bob'}};
const instance=createChatServer({env:{APP_BASE_URL:origin,AUTH0_SESSION_SECRET:'e2e-test-only-session-secret-32-characters'},authMiddleware:(req,res,next)=>{
 const name=/test-user=(alice|bob)/.exec(req.headers.cookie||'')?.[1];
 req.auth0={client:{getSession:async()=> name ? {user:users[name],idToken:'e2e-token-'+name} : undefined,logout:async()=>{res.setHeader('Set-Cookie','test-user=; Max-Age=0; Path=/');return new URL(origin);}}};next();
}});
instance.server.listen(3219);
