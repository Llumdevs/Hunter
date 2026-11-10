# Hunter para locales: piloto

Entrada propia en `/locales` y gestión en `/panel`, con diseño de día. Se sirven
desde el mismo proyecto Next.js: no hay que desplegar una segunda aplicación.

## Local demo personal

Abre `/locales`, entra al panel con tu cuenta o como invitado, completa el perfil
adulto y pulsa **Crear mi local demo**. Se crea uno por cuenta con dos ofertas,
horarios, programación, QR fijo y modo pantalla. El usuario recibe acceso `owner`
a ese organizador y puede editar ofertas y gestionar fotos.

La demo está marcada `is_demo = true`, queda inactiva y fuera del catálogo y del
mapa público. No permite check-ins ni canjes reales: sus estadísticas empiezan en
cero, sin inventar actividad. No concede administración de plataforma. Repetir la
creación devuelve el mismo local; otra cuenta no accede a sus QR ni ofertas.

Al borrar la cuenta se eliminan local, ofertas, credenciales y organizador demo.
Storage conserva las limitaciones de limpieza del sistema de fotos existente.
Cerrar sesión como invitado pierde el acceso a esa cuenta y su demo.

## Alta y aprobación

En `/panel/solicitar-alta` se recoge nombre, tipo, barrio, dirección en Valencia,
contacto privado, precio, coordenadas, días y horario. Se puede marcar la ubicación
en un mapa, escribir las coordenadas o pedir ubicación al navegador.

La base de datos valida todos los campos, impone el usuario de la sesión como
solicitante y guarda el estado pendiente. El cliente no puede autoaprobarse.
Máximo tres pendientes y cinco solicitudes por usuario y día; cancelar no reinicia
el límite diario. En `/panel` se ve el estado, el motivo de rechazo y se puede
cancelar una solicitud pendiente.

**Por decisión del usuario no se asigna ninguna cuenta administradora en pruebas.**
`app.platform_admins` se crea vacío; no hay endpoint para concederse ese permiso.
El local demo funciona sin administrador. Las solicitudes reales permanecerán
pendientes hasta una configuración posterior.

La revisión futura está preparada en `/panel/admin`. Comprueba la designación,
correo confirmado y que no sea una cuenta anónima, también en SQL. No confía en
metadatos editables ni en ser dueño de un local. Aprobar exige confirmación en la
interfaz y crea local publicado, organizador, membresía del solicitante, horarios
y QR aleatorios. Rechazar requiere motivo de 10 a 500 caracteres. Se bloquea la
fila al decidir para impedir dobles aprobaciones. No se envían correos automáticos.

Los administradores usados en tests son fixtures dentro de transacciones con
`ROLLBACK`. No queda ninguna cuenta habilitada tras las pruebas.

## Activación alojada

Aplicar `app/supabase/migrations/20261110180000_venue_onboarding.sql` antes de publicar
las pantallas dependientes. Desde `app`, con el proyecto enlazado y sesión válida:

```bash
npx supabase db push --linked --dry-run
npx supabase db push --linked
```

No ejecutar `db:reset` en remoto. La migración no crea cuentas, no asigna
administradores y no publica datos de demostración en el catálogo.

## Validación

- `npm test`: validación de formulario y errores.
- `npx supabase test db`: RLS, permisos, idempotencia, aislamiento, límites,
  QR privados, aprobación y limpieza al borrar cuentas.
- `npx playwright test --config playwright.auth.config.ts`: navegador y SDK reales
  contra HTTP simulado; entrada, demo, edición de ofertas, QR, alta y cancelación,
  administración denegada y confirmación antes de aprobar.
- `npm run lint`, `npm run typecheck`, `npm run build`.

Estas pruebas no aplican la migración al proyecto alojado ni confirman el despliegue.
