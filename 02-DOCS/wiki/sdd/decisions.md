# Decisiones US-01

2026-11-04: conservar Node/Express/Socket.IO y diseño existente. SDK oficial @auth0/auth0-express, flujo de código con PKCE y cookie cifrada del servidor. Alternativa SPA descartada para evitar tokens de proveedor en el navegador.

2026-11-04: handshake Socket.IO mediante permisos propios firmados de 60 segundos, nombre del servidor y revocación por huella de sesión. Alternativa de pasar tokens Auth0 al navegador descartada por exposición innecesaria.

2026-11-04: Redis Pub/Sub y revocación compartida requeridos en Vercel; memoria local permitida solo para una instancia local. Basado en documentación actual de Vercel que admite WebSockets, sin garantía de misma instancia.

2026-11-04: Google habilitado por conexión social existente para UNA Chat. Cuenta Auth0 iniciada con GitHub. Esas dos autenticaciones tienen propósitos distintos.

2026-11-04: usar proyecto Vercel lab5 existente, sujeto a revisión final de publicación y configuración de secretos. Solo servicios gratuitos autorizados.
