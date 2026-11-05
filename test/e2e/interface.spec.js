const {test,expect}=require('./fixtures');
test('identidad verificada y envío con Enter',async({page})=>{
 await page.goto('/chat');await expect(page.locator('#connection-label')).toHaveText('En línea');
 await expect(page.getByLabel('Usuario autenticado')).toHaveValue('Alice');await expect(page.getByLabel('Usuario autenticado')).toHaveAttribute('readonly','');
 await expect(page.getByRole('button',{name:'Enviar',exact:true})).toBeDisabled();
 await page.getByLabel('Mensaje',{exact:true}).fill('Hola, comunidad');await page.locator('#m').press('Enter');
 await expect(page.locator('#messages li.own .msg-text')).toHaveText('Hola, comunidad');await expect(page.locator('#m')).toHaveValue('');
});
test('dos cuentas reciben mensajes y distinguen autor',async({page,browser})=>{
 const bob=await browser.newContext();await bob.addCookies([{name:'test-user',value:'bob',url:'http://localhost:3219'}]);const other=await bob.newPage();
 await Promise.all([page.goto('/chat'),other.goto('http://localhost:3219/chat')]);
 await expect(other.locator('#connection-label')).toHaveText('En línea');await expect(page.locator('#connection-label')).toHaveText('En línea');
 await page.locator('#m').fill('Mensaje compartido');await page.locator('#m').press('Enter');
 await expect(other.locator('#messages li.other .msg-text')).toHaveText('Mensaje compartido');await expect(other.locator('.msg-meta b')).toHaveText('Alice');await bob.close();
});
test('desconexión conserva borrador y reconecta',async({page})=>{
 await page.goto('/chat');await expect(page.locator('#connection-label')).toHaveText('En línea');await page.locator('#m').fill('Borrador');
 await page.evaluate(()=>socket.disconnect());await expect(page.locator('#connection-label')).toHaveText('Sin conexión');await expect(page.locator('#m')).toHaveValue('Borrador');
 await page.evaluate(()=>socket.connect());await expect(page.locator('#connection-label')).toHaveText('En línea');
});
for(const width of [320,390,768,1440])test(`sin desbordamiento a ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:844});await page.goto('/chat');await expect(page.locator('#connection-label')).toHaveText('En línea');
 await page.locator('#m').fill('TextoLargo'.repeat(50));await page.locator('#m').press('Enter');await expect(page.locator('#messages li')).toHaveCount(1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
});
test('visitante no accede al chat ni al perfil',async({browser})=>{
 const guest=await browser.newContext();const page=await guest.newPage();await page.goto('http://localhost:3219/chat');await expect(page).toHaveURL(/login=required/);
 await expect(page.getByRole('link',{name:'Iniciar sesión con Auth0'})).toBeVisible();const response=await guest.request.get('http://localhost:3219/api/session');expect(response.status()).toBe(401);await guest.close();
});
test('cancelación de login muestra explicación y reintento',async({browser})=>{
 const guest=await browser.newContext();const page=await guest.newPage();await page.goto('http://localhost:3219/?error=authentication');await expect(page.getByRole('alert')).toContainText('Puedes reintentarlo');await expect(page.getByRole('link',{name:'Iniciar sesión con Auth0'})).toBeVisible();await guest.close();
});
