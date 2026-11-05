---
type: spec
title: US-01 Autenticación social
description: Acceso autenticado al chat universitario.
tags: [sdd, spec]
timestamp: 2026-11-04T23:40:00Z
topic: sdd
slug: us01-auth0
status: planned
---
# US-01 Autenticación social
Approved in autopilot: Andrey solicitó completar todo el laboratorio el 2026-11-04.
## Problem & why
Los participantes pueden enviar mensajes con cualquier nombre; el laboratorio exige identidad social verificada sin otra contraseña.
## Cost of not building it
No se cumple US-01 y sigue permitida la suplantación de nombres en el chat.
## The cheapest alternative
Solicitar un nombre es la solución existente, pero no verifica la identidad ni satisface el laboratorio.
## Goals
Acceso social mediante Auth0, identidad visible, cierre de sesión y acceso al chat protegido tanto localmente como en Vercel.
## Non-goals / out of scope
Roles administrativos, historial permanente, nuevos canales, contraseñas propias, cuentas pagadas y rediseño visual completo.
## Users & context
Andrey y participantes de UNA Chat; entrega individual del laboratorio.
## What the user can do
Iniciar sesión con un proveedor social, volver al chat, conversar con identidad verificada y cerrar sesión.
## What result they get
Referencia de comportamiento aprobada: nueve criterios de aceptación de Lab8.docx, US-01. Conservar interfaz publicada en 510ee97, sustituyendo nombre editable por identidad social y agregando entrada/salida.
## What it must respect
Copia antes intacta, diseño UNA existente, multimedia, memoria de Lab6, ningún secreto público y acceso denegado sin sesión.
## How it proves it
Pruebas Jest de HTTP y Socket.IO, Playwright con proveedor local de pruebas, y verificación social real en local y despliegue. Registrar comandos y resultados observados; marcar explícitamente pruebas reales pendientes.
## Behaviour
Visitantes ven entrada con botón de login. Autenticados ven nombre y chat. Cancelaciones y errores muestran explicación genérica con reintento. Logout cierra las conexiones de la sesión y vuelve a entrada.
## Acceptance criteria
1. Cuenta personal y aplicación Auth0 configuradas.
2. Al menos un proveedor social habilitado.
3. URLs callback/logout/orígenes locales y Vercel configuradas.
4. Login social local regresa autenticado.
5. Identidad visible y logout funcional.
6. Sin sesión no se recibe ni envía contenido del chat; rechazar suplantación.
7. Login y logout reales funcionan en Vercel.
8. Variables de entorno, .env.example y ausencia de secretos públicos.
9. Cancelación y error muestran mensaje claro y reintento.
## Points to clarify
- suposición tomada: reutilizar identidad GitHub para cuenta Auth0 y elegir proveedor disponible gratuito; base: indicación de Andrey.
- decisión diferida: dominio de Vercel se determina al crear despliegue; no inventarlo.
