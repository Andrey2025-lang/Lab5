const {test,expect}=require('./fixtures');
test('HTML malicioso se muestra literal sin insertar nodos ni ejecutar eventos',async({page})=>{
 await page.goto('/chat');await expect(page.locator('#connection-label')).toHaveText('En línea');let dialogs=0;page.on('dialog',async dialog=>{dialogs++;await dialog.dismiss();});
 const payload='<img src=x onerror=alert(1)><svg onload=alert(2)>';
 await page.locator('#m').fill(payload);await page.locator('#m').press('Enter');await expect(page.locator('.msg-text')).toHaveText(payload);
 await expect(page.locator('.msg-text img, .msg-text svg')).toHaveCount(0);expect(dialogs).toBe(0);
});
test('imágenes y YouTube se crean como elementos seguros en móvil',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.route('https://example.com/prueba.png',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"/>'}));
 await page.route('https://www.youtube.com/embed/**',route=>route.fulfill({contentType:'text/html',body:'<title>Video</title>'}));
 await page.goto('/chat');await expect(page.locator('#connection-label')).toHaveText('En línea');
 await page.locator('#m').fill('https://example.com/prueba.png');await page.locator('#m').press('Enter');await expect(page.locator('#messages img')).toBeVisible();
 await page.waitForTimeout(300);await page.locator('#m').fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');await page.locator('#m').press('Enter');await expect(page.locator('#messages iframe')).toBeVisible();
 expect(await page.locator('#messages').evaluate(el=>el.scrollWidth>el.clientWidth)).toBe(false);
});
test('rechazo por ritmo conserva el borrador para reintentar',async({page})=>{
 await page.goto('/chat');await expect(page.locator('#connection-label')).toHaveText('En línea');
 await page.evaluate(()=>new Promise(resolve=>socket.emit('Evento-Mensaje-Server',{mensaje:'Primero'},()=>{const input=document.getElementById('m'); input.value='No perder este mensaje'; input.dispatchEvent(new Event('input')); document.getElementById('message-form').requestSubmit();resolve();})));
 await expect(page.getByRole('alert')).toContainText('Espera');await expect(page.locator('#m')).toHaveValue('No perder este mensaje');
});
