# UNA Chat con Auth0

Chat universitario con autenticación social obligatoria. Conserva Express, Socket.IO y el diseño UNA. El servidor determina el autor de cada mensaje a partir de la sesión verificada.

## Requisitos

- Node.js 22.12 o superior y npm.
- Cuenta personal de Auth0, aplicación de tipo **Regular Web Application** y al menos una conexión social habilitada.
- Vercel con Fluid Compute habilitado. Redis con protocolo TCP para compartir la sala y revocaciones entre instancias.

## Ejecutar localmente

1. Ejecutar `npm ci`.
2. Copiar `.env.example` a `.env` y completar los valores desde Auth0. `.env` está excluido de Git.
3. Generar una clave de sesión: `node -e "console.log(require('node:crypto').randomBytes(64).toString('hex'))"`. Guardarla en `AUTH0_SESSION_SECRET`.
4. Configurar `APP_BASE_URL=http://localhost:3001`.
5. En Auth0, habilitar la conexión social en **Applications → UNA Chat → Connections**.
6. En **URLs**, guardar:

| Campo | Local | Producción |
| --- | --- | --- |
| Allowed Callback URLs | `http://localhost:3001/auth/callback` | `https://lab5-hazel.vercel.app/auth/callback` |
| Allowed Logout URLs | `http://localhost:3001` | `https://lab5-hazel.vercel.app` |
| Allowed Web Origins | `http://localhost:3001` | `https://lab5-hazel.vercel.app` |

7. Ejecutar `npm start` y abrir `http://localhost:3001`.
8. Pulsar **Iniciar sesión con Auth0**, elegir el proveedor social y aceptar el consentimiento inicial. El retorno es `/chat` con identidad y estado **En línea**.
9. **Cerrar sesión** revoca los permisos del chat y termina la sesión de Auth0. Si Auth0 muestra una confirmación de salida, confirmarla.

No hace falta Redis para una sola instancia local. Para probar múltiples procesos, asignarles el mismo `REDIS_URL` y secreto de sesión. No reutilizar secretos de producción en pruebas.

## Variables

| Variable | Uso |
| --- | --- |
| AUTH0_DOMAIN | Dominio del tenant, sin `https://` |
| AUTH0_CLIENT_ID | Identificador de la aplicación web |
| AUTH0_CLIENT_SECRET | Secreto de cliente; solo servidor |
| AUTH0_SESSION_SECRET | Clave aleatoria de al menos 32 caracteres para cookie y tickets; solo servidor |
| APP_BASE_URL | Origen exacto del despliegue, sin barra final |
| PORT | Puerto local; predeterminado 3001 |
| REDIS_URL | URL `redis://` o `rediss://`; obligatoria en Vercel |

## Despliegue en Vercel

El proyecto existente es **lab5**, dominio `https://lab5-hazel.vercel.app`. Verificar que apunta a la revisión final antes de entregar; la existencia del dominio no demuestra que el último código esté desplegado.

1. Configurar las variables anteriores en el proyecto, con `APP_BASE_URL=https://lab5-hazel.vercel.app`; no definir `PORT` en Vercel.
2. Usar otro `AUTH0_SESSION_SECRET` para producción. Marcar los secretos como sensibles cuando esté disponible.
3. Conectar Redis gratuito con soporte Pub/Sub y guardar su conexión como `REDIS_URL`. No usar una URL REST en esa variable.
4. Mantener Fluid Compute activo. `api/server.js` exporta el servidor HTTP; `vercel.json` dirige las rutas a esa función.
5. Cliente Socket.IO con transporte WebSocket directo, ruta `/api/socket-io/socket.io` y reconexión al vencer el permiso breve o la función.
6. Añadir las URLs de producción a Auth0, conservando las locales.
7. Publicar la revisión revisada y verificar `/health`, login social, dos clientes, logout y acceso anónimo rechazado.

Redis coordina mensajes y revocaciones; no guarda historial de conversación. Si falta Redis en Vercel, el servicio se declara no disponible y rechaza sesiones para evitar salas fragmentadas. Las conexiones se renuevan aproximadamente cada 60 segundos y pueden interrumpirse al cambiar de despliegue.

Referencia: [WebSockets y Socket.IO en Vercel](https://vercel.com/docs/functions/websockets), [SDK oficial de Auth0 para Express](https://github.com/auth0/auth0-express/tree/main/packages/auth0-express).

## Pruebas y evidencias

- `npm test -- --runInBand`: controles HTTP, tickets alterados/expirados, identidad del servidor, mensajes y logout.
- `npm run check`: revisión de sintaxis.
- `npx playwright test`: inicia un servidor separado en `3219` y ejecuta Chromium sin interfaz.
- Si falta Chromium: `npx playwright install chromium`.
- `npm audit --omit=dev`: revisión de dependencias de producción.

El servidor `test/support/e2e-server.js` simula únicamente el límite del SDK para comprobar UI sin pedir contraseñas. Nunca se importa en producción. Esas pruebas no sustituyen el login social real. Evidencia local: `evidence/local-authenticated.png`. El estado de verificación actualizado se registra en `02-DOCS/wiki/sdd/verifications/`.

## Seguridad y errores

- Cookie cifrada HttpOnly; Secure al usar HTTPS y SameSite Lax.
- `/chat`, `/chat.js`, perfil y emisión de permisos requieren sesión; el formulario de envío de permisos y logout exige origen exacto.
- Tickets firmados de 60 segundos, mantenidos en memoria del navegador; logout los revoca y desconecta todas las pestañas de esa sesión.
- El cliente no decide nombre, identificador ni color. Mensajes limitados a 4000 caracteres y envío espaciado.
- Mensajes mostrados mediante texto y elementos multimedia explícitos; no se inserta HTML arbitrario.
- Cancelaciones/errores regresan a una pantalla genérica con reintento, sin detalles del proveedor ni secretos.
- Los mensajes se comparten con los usuarios autenticados de la sala general. No hay historial persistente.

## Harness y memoria

Se instaló **rsc-harness 4.0.5**, plan `b10fffd77749547443d8e7bfe0046d3b49db75eb91b313deecc2ba1484696f9c`, adaptado a Codex. Consultar `AGENTS.md`, `.rsc.json` y `02-DOCS/wiki/index.md`.

En una clonación nueva, reconstruir los archivos locales del harness con `npx @ericrisco/rsc@4.0.5 sync`. `.rsc/` y enlaces locales no se publican. La memoria del propietario se conserva en el repositorio Lab6, `../../brain` desde esta copia del chat; no se crea una segunda bóveda personal.
