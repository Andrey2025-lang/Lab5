const { test, expect } = require('@playwright/test');

test.describe('UNA Chat - Flujo Completo', () => {

  test('Debe mostrar una imagen al enviar una URL válida', async ({ page }) => {
    await page.goto('/');
    
    // Llenar el nombre de usuario y el mensaje
    await page.locator('#nombre').fill('Tester Playwright');
    await page.locator('#m').fill('https://picsum.photos/200/300');
    
    // Hacer clic en enviar
    await page.getByRole('button', { name: 'Send' }).click();

    // Verificar que la imagen aparezca en el chat
    const imagen = page.locator('img[src="https://picsum.photos/200/300"]');
    await expect(imagen).toBeVisible();
  });

  test('Debe mostrar un reproductor de video al enviar URL de YouTube', async ({ page }) => {
    await page.goto('/');
    
    await page.locator('#nombre').fill('Tester Playwright');
    await page.locator('#m').fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    
    await page.getByRole('button', { name: 'Send' }).click();

    // Verificar que el iframe del video de YouTube aparezca
    const iframeVideo = page.locator('iframe[src*="youtube.com/embed"]');
    await expect(iframeVideo).toBeVisible();
  });

  test('Debe bloquear la inyección de scripts (XSS)', async ({ page }) => {
    await page.goto('/');
    
    // Configurar un "espía" para detectar si sale una alerta en pantalla
    let alertaDetectada = false;
    page.on('dialog', async dialog => {
      alertaDetectada = true;
      await dialog.dismiss();
    });

    await page.locator('#nombre').fill('Tester Playwright');
    await page.locator('#m').fill("<script>alert('Inyección de script');</script>");
    
    await page.getByRole('button', { name: 'Send' }).click();

    // Esperar un momento para ver si salta la alerta
    await page.waitForTimeout(1000);

    // Verificamos que la alerta NO haya aparecido (el script fue bloqueado)
    expect(alertaDetectada).toBe(false);
  });

});