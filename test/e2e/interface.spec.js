const { test, expect } = require('@playwright/test');

test('Muestra la bienvenida y permite enviar con Enter sin aceptar mensajes vacíos', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'UNA Chat' })).toBeVisible();
  await expect(page.locator('#connection-label')).toHaveText('En línea');
  await expect(page.locator('#empty-state')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enviar' })).toBeDisabled();
  await page.locator('#m').fill('   ');
  await expect(page.getByRole('button', { name: 'Enviar' })).toBeDisabled();
  await page.getByLabel('Tu nombre').fill('Andrey');
  await page.getByLabel('Mensaje', { exact: true }).fill('Hola, comunidad');
  await page.locator('#m').press('Enter');
  await expect(page.locator('#messages li.own .msg-text')).toHaveText('Hola, comunidad');
  await expect(page.locator('.msg-meta b')).toHaveText('Andrey');
  await expect(page.locator('.msg-meta time')).not.toBeEmpty();
  await expect(page.locator('#empty-state')).toBeHidden();
  await expect(page.locator('#m')).toBeFocused();
  await expect(page.getByRole('button', { name: 'Enviar' })).toBeDisabled();
});

test('Distingue mensajes propios y recibidos entre dos clientes', async ({ page, context }) => {
  const otherPage = await context.newPage();
  await Promise.all([page.goto('/'), otherPage.goto('/')]);
  await expect(page.locator('#connection-label')).toHaveText('En línea');
  await expect(otherPage.locator('#connection-label')).toHaveText('En línea');
  await page.locator('#nombre').fill('Andrey');
  await otherPage.locator('#nombre').fill('Compañera');
  await page.locator('#m').fill('Mensaje entre clientes');
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.locator('#messages li.own')).toHaveCount(1);
  await expect(otherPage.locator('#messages li.other .msg-text')).toHaveText('Mensaje entre clientes');
  await otherPage.close();
});

test('Muestra la desconexión y conserva el borrador hasta reconectar', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#connection-label')).toHaveText('En línea');
  await page.locator('#m').fill('Borrador pendiente');
  await page.evaluate(() => socket.disconnect());
  await expect(page.locator('#connection-label')).toHaveText('Sin conexión');
  await expect(page.getByRole('button', { name: 'Enviar' })).toBeDisabled();
  await expect(page.locator('#m')).toHaveValue('Borrador pendiente');
  await page.evaluate(() => socket.connect());
  await expect(page.locator('#connection-label')).toHaveText('En línea');
  await expect(page.getByRole('button', { name: 'Enviar' })).toBeEnabled();
});

test('Presenta el nombre como texto y no como HTML', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#connection-label')).toHaveText('En línea');
  const name = '<img src=x onerror=alert(1)>';
  await page.locator('#nombre').fill(name);
  await page.locator('#m').fill('Prueba de nombre');
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.locator('.msg-meta b')).toHaveText(name);
  await expect(page.locator('.msg-meta img')).toHaveCount(0);
});

for (const width of [320, 390, 768, 1440]) {
  test(`Diseño sin desbordamiento horizontal a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await expect(page.locator('#connection-label')).toHaveText('En línea');
    await expect(page.getByLabel('Tu nombre')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enviar' })).toBeVisible();
    await page.locator('#m').fill('MensajeLargo'.repeat(50));
    await page.getByRole('button', { name: 'Enviar' }).click();
    await expect(page.locator('#messages li')).toHaveCount(1);
    const overflow = await page.evaluate(() => ({
      document: document.documentElement.scrollWidth > window.innerWidth,
      messages: document.getElementById('messages').scrollWidth > document.getElementById('messages').clientWidth
    }));
    expect(overflow).toEqual({ document: false, messages: false });
    expect(errors).toEqual([]);
  });
}

test('Mantiene imágenes y videos dentro del panel en celular', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  // Aislar la presentación de la disponibilidad de servicios externos.
  await page.route('https://example.com/prueba.png', route => route.fulfill({
    contentType: 'image/svg+xml',
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#a91d36"/></svg>'
  }));
  await page.route('https://www.youtube.com/embed/**', route => route.fulfill({
    contentType: 'text/html', body: '<!doctype html><title>Video de prueba</title>'
  }));
  await page.goto('/');
  await expect(page.locator('#connection-label')).toHaveText('En línea');
  for (const message of ['https://example.com/prueba.png', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ']) {
    await page.locator('#m').fill(message);
    await page.getByRole('button', { name: 'Enviar' }).click();
  }
  await expect(page.locator('#messages img')).toBeVisible();
  await expect(page.locator('#messages iframe')).toBeVisible();
  const dimensions = await page.locator('#messages').evaluate(list => ({
    overflow: list.scrollWidth > list.clientWidth,
    media: [...list.querySelectorAll('img, iframe')].map(element => ({
      width: element.getBoundingClientRect().width,
      available: element.closest('.bubble').getBoundingClientRect().width
    }))
  }));
  expect(dimensions.overflow, JSON.stringify(dimensions)).toBe(false);
  for (const media of dimensions.media) expect(media.width).toBeLessThanOrEqual(media.available);
});
