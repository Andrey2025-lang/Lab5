---
type: constitution
title: UNA Chat Constitution
version: v1.0.0
timestamp: 2026-11-04T23:40:00Z
---
# UNA Chat
Ratificación provisional en ejecución automática autorizada por Andrey el 2026-11-04.
## Principles
1. Conservar Node.js, Express, Socket.IO y el diseño UNA; Node >=22.12.0.
2. Autenticación social Auth0 obligatoria en HTTP y mensajes. Identidad del servidor; nunca confiar en el nombre enviado por el cliente.
3. Secretos solo en variables de entorno, cookies HttpOnly y Secure en HTTPS. No incluir credenciales en documentación ni evidencias.
4. No modificar la copia externa antes ni descartar cambios previos. No publicar sin revisar el resultado.
5. Errores en español con reintento. Conservar texto, imágenes, videos y adaptación móvil; renderizar solo HTML permitido.
6. Memoria canónica del propietario: ../../brain desde este repositorio; consultar ../../brain/daily-log/status.md. Documentación técnica del harness: 02-DOCS/wiki.
7. Git usa el autor humano configurado, sin firmas del asistente. Decisiones significativas registradas.
## Definition of Done
Jest verifica acceso anónimo, sesión, identidad, sockets, expiración y XSS. Playwright verifica presentación. Login real local y en Vercel requieren cuenta configurada y evidencia; nunca sustituirlos por mocks.
## Amendment log
2026-11-04 v1.0.0: base provisional derivada de Lab8 y del proyecto, bajo autorización de ejecución autónoma.
