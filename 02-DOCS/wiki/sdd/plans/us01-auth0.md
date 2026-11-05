# Plan US-01
Approved in autopilot por autorización de Andrey. Spec: ../specs/us01-auth0.md.
## 0. Global Constraints
Node >=22.12.0. No secretos en Git ni navegador. Copia antes intacta. Identidad del servidor. Diseño UNA y multimedia conservados. Sin publicaciones no revisadas.
## 1. Context & constraints
Aplicación Express existente con Socket.IO. US-01 criterios 1-9 son el alcance. Memoria canónica ../../brain.
## 2. Architecture
Navegador -> Express -> Auth0 externo. Express entrega sesión por cookie cifrada HttpOnly, y tickets breves para Socket.IO. Redis externo opcional en local, requerido para coordinar instancias en Vercel. Mantener un servidor y evitar segundo proveedor de identidad.
## 3. Interfaces & contracts
GET /: entrada pública sin mensajes. GET /chat: requiere sesión. GET /api/session: identidad mínima, sin tokens. POST /api/socket-ticket: requiere sesión y Origin exacto; ticket firmado de 60 segundos. Socket autentica ticket, deriva nombre del sujeto y desconecta al expirar. Mensajes limitados a 4000 caracteres. Rutas SDK /auth/login /auth/callback /auth/logout.
## 4. Data model & flow
Usuario {sub,name}; sesión cifrada del SDK; ticket {sub,name,exp,color}. Ticket solo en memoria, no URL ni almacenamiento persistente. Logout cliente desconecta y avisa otras pestañas. No guardar mensajes.
## 5. Testing strategy
Criterio 6: HTTP anónimo y socket sin credencial denegados, ticket alterado/expirado rechazado y nombre falsificado sobrescrito. Criterio 8: revisión Git/variables. Criterios 4,5,9: integración con OIDC local simulado y después proveedor real. Criterio 7 exige URL real, no basta test local.
## 6. Sequencing & dependencies
- [ ] T1 configuración SDK, entrada y protección HTTP; comprobar 401/503 sin sesión/configuración.
- [ ] T2 tickets firmados, socket protegido e identidad del servidor; probar falsificación, expiración y multicast.
- [ ] T3 interfaz autenticada, multimedia segura y errores; comprobar en navegador.
- [ ] T4 Vercel con servidor HTTP exportado y Redis adapter; documentación y .env.example.
- [ ] T5 cuenta/proveedor/URLs reales, login local, despliegue y evidencia.
## 7. Risks & open decisions
Cuenta externa requiere autorizaciones humanas de acceso. Vercel distribuye conexiones: Redis evita fragmentar la sala. SDK actual requiere verificar API instalada. Nunca dar por realizados login ni despliegue antes de observarlos.
