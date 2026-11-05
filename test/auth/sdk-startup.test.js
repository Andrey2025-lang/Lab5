const {spawnSync}=require('node:child_process');
test('servidor con SDK real inicia sin require(ESM), sin contactar al proveedor',()=>{
 const script=`const {createChatServer}=require('./libs/app');
 const instance=createChatServer({env:{AUTH0_DOMAIN:'test.us.auth0.com',AUTH0_CLIENT_ID:'test-client',AUTH0_CLIENT_SECRET:'test-client-secret',AUTH0_SESSION_SECRET:'test-only-session-secret-32-characters',APP_BASE_URL:'http://localhost:3001'}});
 instance.server.listen(0,'127.0.0.1',async()=>{try{const r=await fetch('http://127.0.0.1:'+instance.server.address().port+'/');if(r.status!==200 || !(await r.text()).includes('Bienvenido a UNA Chat'))process.exitCode=1;}catch{process.exitCode=1;}finally{await instance.chat.close();}});`;
 const result=spawnSync(process.execPath,['--no-experimental-require-module','-e',script],{cwd:process.cwd(),encoding:'utf8',timeout:15000});
 expect({status:result.status,stderr:result.stderr}).toEqual({status:0,stderr:''});
});
