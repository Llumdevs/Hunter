# Hunter · app

## Compras y ranking mensual

Reglas, límites, demo y activación: [`../docs/compras-ranking.md`](../docs/compras-ranking.md).
La migración `20261112120000_purchase_rewards.sql` sustituye los puntos por visitas
por compras validadas por personal e invitaciones por código. No hay red social.
Ranking voluntario con alias y premio ficticio, sin administradores configurados.

## Hunter para locales

Entrada en `/locales` y gestión en `/panel`, dentro del mismo despliegue.
La migración `20261110180000_venue_onboarding.sql` permite crear un local demo
personal con ofertas y QR sin publicar el local ni conceder administración.

El alta se solicita en `/panel/solicitar-alta` y se consulta o cancela desde el
panel. Por decisión del usuario no se asigna ninguna cuenta administradora en
pruebas; las solicitudes quedan pendientes. La revisión está preparada para
cuando se configure una cuenta autorizada.

Activación, permisos y pruebas: [`../docs/locales.md`](../docs/locales.md).

## Mapa y demostración

- La barra inferior tiene cinco accesos. El menú lateral de la cabecera contiene
  Perfil, Gustos, Valoraciones, Pruebas y datos demo, Privacidad y Salir.
- El mapa usa Leaflet y el callejero de OpenStreetMap con atribución. No requiere
  una clave. El navegador debe poder acceder a `tile.openstreetmap.org`.
  Se pide permiso de ubicación al entrar en Mapa; si se deniega se puede seguir
  explorando Valencia. La ubicación se usa en memoria para el punto azul y las
  distancias; no se guarda por abrir el mapa.
- Si no se cargan las imágenes del callejero, se ofrece un mapa sin calles y
  sigue disponible la lista. Una ubicación fuera de Valencia no cambia el
  encuadre inicial de todos los locales; hay un control para centrarse en ella.
- Cuando `tonight_places` devuelve una lista vacía (sin error), aparecen cuatro
  locales y eventos **Demo**. Los errores de API se muestran y no se disfrazan
  de datos de prueba. Los datos reales tienen prioridad.
- En **Pruebas y datos demo** se pueden abrir los cuatro eventos y reiniciar
  los planes simulados. La demo permite apuntarse, simular check-in,
  valorar y simular compras validadas sin escribir en Supabase ni otorgar puntos reales.
  Se guarda en `localStorage` (`hunter-demo-v1`) de ese navegador, separada de
  la cuenta real. Los datos antiguos se migran sin recuperar la red social.
- Los ejemplos de la interfaz no
  se cargan en las tablas de producción ni usan el seed local.

## Funciones del piloto

La migración `20261110170000_pilot_social.sql` añade procedencia privada,
feedback, solicitudes de amistad por código y valoraciones de visitas verificadas.
Aplicarla con `npx supabase db push --linked` antes de desplegar estas pantallas.
No usar `db:reset` en el proyecto alojado.

La migración de compras retira las solicitudes de amistad y congela los puntos
anteriores como histórico. Los nuevos puntos solo proceden de compras e invitaciones
cualificadas, con los límites documentados arriba. Las medias de los locales se
muestran desde tres valoraciones; los comentarios no son públicos.

La portada permite filtrar temporalmente música, ambiente y presupuesto sin
cambiar los gustos guardados. El mapa permite seleccionar un local para ver su
oferta y abrir la ficha. Comparación y límites: [`../docs/revision-piloto.md`](../docs/revision-piloto.md).

## Acceso del piloto alojado

- **Probar sin correo** crea una sesión de invitado real de Supabase. Activar
  **Authentication → Sign In / Providers → Anonymous Sign-ins** en el proyecto alojado.
  Cada invitado tiene su propio usuario y queda sujeto a las mismas políticas RLS;
  debe completar el perfil de mayor de edad. No recibe permisos del panel del local.
  Si cierra sesión o borra el navegador, no puede recuperar esa cuenta.
- El acceso por email utiliza el enlace predeterminado de Supabase. En
  **Authentication → URL Configuration**, establecer Site URL en la URL pública
  (actualmente `https://hunter-llumdevs.vercel.app`) y autorizar
  `https://hunter-llumdevs.vercel.app/auth/callback**` en Redirect URLs.
  El callback guarda la sesión y vuelve al destino o al alta del perfil.
- `NEXT_PUBLIC_APP_ORIGIN` debe coincidir con el origen público del despliegue.
  El enlace PKCE debe abrirse en el mismo navegador donde se pidió. Para probar
  desde una PWA de iPhone sin cambiar de navegador, usar el acceso de invitado.
- El servicio predeterminado de correo de Supabase tiene restricciones de destinatarios
  y límites de envío. Corregir el callback no elimina esos límites. No hace falta
  configurar SMTP para probar como invitado.
- Las plantillas locales siguen enviando códigos: el formulario conserva una sección
  opcional para introducirlos. Los enlaces caducados o inválidos muestran un error recuperable.
- Aplicar las migraciones no carga los locales del seed local. Verificar los datos
  alojados por separado antes de esperar locales en «Esta noche».

Validación aislada del login, sin correos ni credenciales reales:

```bash
npx playwright install chromium
npx playwright test --config playwright.auth.config.ts
```

En máquinas con Chromium del sistema se puede indicar
`PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium`. Estos tests usan el SDK real,
cookies y PKCE contra un servidor HTTP simulado; no verifican el envío real de correo
ni la configuración del proyecto alojado.

PWA (Next.js 16) + Supabase en local. Producto y decisiones: [`../brief-mvp-v2.md`](../brief-mvp-v2.md).

## Requisitos
- Node 22 y npm
- Docker en marcha (para la base de datos local)

## Comandos
| Comando | Qué hace |
|---|---|
| `npm install` | Instala dependencias (incluida la CLI de Supabase) |
| `npm run db:start` | Arranca Supabase local (Postgres 17 + PostGIS) |
| `npm run db:reset` | Recrea la base de datos aplicando las migraciones |
| `npm run db:test` | Tests pgTAP de `supabase/tests/database` |
| `npm run db:lint` | Análisis estático de funciones (plpgsql_check) |
| `npm run db:coverage` | Cobertura de sentencias y ramas de las funciones PL/pgSQL |
| `npm run lint` · `npm run typecheck` · `npm run build` | Comprobaciones del frontend |
| `npm run dev` | Servidor de desarrollo (http://127.0.0.1:3000) |
| `npm test` | Tests unitarios (Vitest) |
| `npm run test:coverage` | Cobertura de la lógica de `src/lib` |
| `npm run test:mutation` | Mutación con Stryker sobre `src/lib` (umbral 80 %) |
| `npm run test:integration` | Flujo completo contra Supabase local (antes: `npm run db:reset`) |
| `npm run db:types` | Regenera `src/lib/supabase/database.types.ts` tras cambiar migraciones |

### Probar el flujo en local
1. `npm run db:reset` y `npm run dev`.
2. Abre http://127.0.0.1:3000/c/30000000-0000-0000-0000-0000000000d1?k=demo-token-0123456789abcdef (bar de demostración, abierto 24 h).
3. El código de acceso llega a Mailpit: http://127.0.0.1:54324.
4. La cámara y la ubicación solo funcionan en `localhost`/`127.0.0.1` o con HTTPS.
5. **Si cambias `supabase/config.toml`** (p. ej. las plantillas de correo), reinicia Supabase (`npm run db:stop && npm run db:start`):
   `db:reset` no recarga la configuración de Auth.
6. Tests E2E en navegador (Chromium, móvil): `npm run test:e2e` (`npx playwright install chromium` la primera vez).

## Qué hay implementado
Migraciones en `supabase/migrations/`:
- `…_core_schema.sql`: ciudades, perfiles, organizadores, lugares, horarios, ofertas, prelistas, check-ins y canjes;
  esquema `app` (no expuesto por la API) con secretos de QR, configuración y lógica de servidor; RLS en todas las tablas.
- `…_retention.sql`: la latitud y la longitud de los check-ins se borran a los 60 días (`location_retention_days`);
  se conservan `distance_m` y `geo_ok`. Tarea nocturna `purge-personal-data` con pg_cron (04:30 UTC).
- `…_rate_limit.sql`: máximo 10 intentos de check-in y 10 de canje por usuario cada 10 minutos (configurable).
  Los intentos fallidos también cuentan. Los registros de intentos se borran a las 24 h.

### Sesión de apertura
La noche de un check-in es la **fecha en que empezó la apertura del local** que contiene esa hora
(`app.opening_session`). Un cierre igual o anterior a la apertura significa que cierra al día siguiente,
así que un after de 23:00 a 09:00 funciona. La regla fija de 18:00 a 08:00 (`app.night_date`) queda para eventos sin horario.

### API pública (únicas puertas de escritura)
`public.check_in(p_place_id, p_static_token, p_screen_code, p_lat, p_lng)` y `public.redeem(p_checkin_id, p_offer_id)`.
Usan el usuario de la sesión y la hora real, y **nunca lanzan errores de negocio**; devuelven:

```ts
type CheckInResult = { ok: true; checkin: Checkin } | { ok: false; error: CheckInError };
type RedeemResult  = { ok: true; redemption: Redemption } | { ok: false; error: RedeemError };
```

Códigos de error: `rate_limited`, `place_unavailable`, `not_adult`, `qr_invalid`, `invalid_location`, `too_far`,
`place_closed`, `already_checked_in`, `checkin_not_found`, `checkin_expired`, `offer_unavailable`, `offer_expired`,
`already_redeemed`.

**Límites por IP de Auth** (`[auth.rate_limit]` en `supabase/config.toml`): se dejan los valores por defecto
(30 registros o inicios de sesión cada 5 min por IP). No se endurecen porque en una welcome week muchos
estudiantes comparten la misma IP de la wifi. En el proyecto alojado hay que revisarlos en el panel o con `supabase config push`.

### QR de pantalla
Código = 8 primeros caracteres hex de `HMAC-SHA256(secreto_del_local, floor(epoch / 30))`.
Se acepta el paso anterior, el actual y el siguiente (tolera 30 s de desfase de reloj en el dispositivo del local).
El modo pantalla del panel (`/panel/[id]/pantalla`) lo calcula en el navegador con WebCrypto (`src/lib/venue/screen-code.ts`). Vectores de referencia (secreto `secret-1`):
paso `59012345` → `43dd8124`, paso `0` → `da70af9b`. El navegador del local debe calcular lo mismo con WebCrypto.

## Panel del local (`/panel`)
Cifras por noche (apuntados, check-ins, canjes y canjes que se cobrarían), ofertas (crear, editar, pausar),
QR fijo para imprimir y modo pantalla. Solo agregados: el local nunca ve datos individuales.
Para dar acceso en local: `npm run db:grant-staff -- <email>` (bar de demostración por defecto).

## Frontend implementado
Login con código, alta de perfil (+18, validado también en RLS), página del QR `/c/[placeId]`, flujo de check-in y canje,
pantalla de canje (`/canje/[id]`) y escáner (`/escanear`). La lógica está en `src/lib` con tests unitarios.

## Pendiente (siguientes incrementos)
- Traducción al inglés.
- Panel del local: perfil agregado del público (con muestra mínima), gráfica semanal, alta de locales desde un admin.
- Panel del local (incluido el modo pantalla) y vistas agregadas con muestra mínima.
- Eventos especiales (modo Fallas) e integración de cobro/TPV.
- Límite por IP en las funciones públicas: requiere una capa delante de la API (proxy o CDN). Hoy el límite es por usuario.
