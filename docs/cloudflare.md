# Hunter en Cloudflare Workers

## Estado de esta entrega (17 de noviembre de 2026)

Preparado y probado **localmente en workerd**, el runtime de Workers. No hay un
Worker alojado, dominio nuevo ni migración de producción. `wrangler whoami`
indica que no hay sesión Cloudflare; no se ha creado cuenta temporal ni comprado
un plan. Vercel y Supabase alojado siguen intactos.

## Elección técnica

Hunter usa Next 16.4.5, React 19, Server Components, rutas con servidor, callback,
cookies y Leaflet. No es una exportación estática para Pages.

La guía actual de Cloudflare propone **vinext (beta)** en su flujo automático.
Migrar el motor de compilación a Vite no es necesario para esta entrega.
OpenNext es la alternativa oficial documentada para conservar el build Next.
Se fijan `@opennextjs/cloudflare@1.20.17` y `wrangler@4.164.0`; el adaptador declara
compatibilidad con Next `>=15.5.29 <16 || >=16.4.5`. No se actualizó ninguna de las
versiones ya bloqueadas: las adiciones transitivas pertenecen al adaptador.

La tabla oficial marca Node middleware como no soportado; el adaptador ofrece
un camino experimental. Para no depender de él, el refresco Supabase pasa de
`src/proxy.ts` a `src/middleware.ts` (convención todavía disponible en Next16,
pero deprecada). Conserva la lógica de cookies y usa Web APIs compatibles con
Edge. El build confirma un middleware Edge separado, sin usar Node middleware.
Next muestra el aviso de deprecación: se debe revisar esta elección al actualizar
Next/OpenNext. Funciona también en el flujo Next/Vercel comprobado.

`nodejs_compat` permite las dependencias del servidor. La fecha de compatibilidad
se fija en `2026-11-17`. El mapa Leaflet se conserva en cliente. El contrato de
navegador cubre RSC, renderizado servidor, handlers de autenticación, WebCrypto
del SDK, cookies, logout, cabeceras, protección de paneles y flujos de compras
simulados. No se han añadido Server Actions nuevas.

No se configuran R2, KV, Durable Objects, base nueva ni Cloudflare Images. Las
páginas de catálogo, fichas y datos de sesión se resuelven dinámicamente; no se
comparte una caché persistente de sesiones. No se promete ISR distribuido: si se
introduce revalidación persistente habrá que configurar y probar su caché.

Las imágenes se sirven sin optimizador únicamente en build Cloudflare, evitando
necesitar el servicio Images. Se mantienen WebP existentes y las fotos de Storage.
En Next/Vercel se conserva el comportamiento previo. Esto puede aumentar ancho
de banda de fotos grandes: medir antes de un piloto amplio.

## Requisitos y variables

Usar Node 22.12 o posterior (probado con 24.22.1), npm y Ubuntu/WSL en Windows.
Se ejecuta todo desde `app/`. Conservar el lockfile y usar `npm ci`.

| Variable | Dónde configurarla | Uso |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Build y configuración del Worker | Proyecto Supabase autorizado |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Build y Worker | Clave publicable, nunca service_role |
| `NEXT_PUBLIC_APP_ORIGIN` | Build y Worker, mismo origen | URLs absolutas, callback y compartir |
| `HUNTER_ENV` | Build y Worker | `preview` por defecto; `production` solo en el principal |
| `HUNTER_INDEXING_ENABLED` | Build y Worker | `false` durante pruebas; `true` solo para activar SEO |
| `HUNTER_CLOUDFLARE` | Lo fija el script | Desactiva optimización de imágenes en este build |

Next incorpora `NEXT_PUBLIC_*` en el paquete: **cambiar solo runtime no cambia el
origen del cliente**. Reconstruir tras cambiar proyecto, clave u origen. Las
variables del shell usadas para construir no configuran por sí solas un Worker
remoto. En Cloudflare CI se deben definir los valores de build; para runtime,
configurar las mismas variables en `wrangler.jsonc` (`vars`) o como secretos de
Worker mediante `wrangler secret put NOMBRE`. Las variables públicas pueden ser
texto plano; los mecanismos de secretos sirven también para evitar publicarlas
en un fichero versionado. No hace falta ninguna service_role ni token Supabase
administrativo en la aplicación.

Para preview local, crear `.dev.vars` a partir de `.dev.vars.example` con valores
del entorno de pruebas. Está ignorado por Git. `.env.local` configura el build
Next, pero no debe darse por supuesto que configura el runtime de Wrangler.
No subir `.env.local`, `.dev.vars`, tokens CLI ni los artefactos generados.

En esta nube, el postinstall de `rclone.js` no pudo descargar su binario
(`downloads.rclone.org`, EAI_AGAIN). Solo para superar esa limitación local se
instaló con `npm install --ignore-scripts` y se reconstruyeron binarios con
`npm rebuild esbuild workerd sharp`. No se cambió configuración global de npm.
El binario rclone no se usa porque no hay caché R2. En una máquina con red normal
usar `npm ci`; si reaparece el bloqueo, revisar el acceso de red antes de omitir
scripts. Supabase CLI local puede necesitar su instalación normal para los tests DB.

## Construcción y preview local

Primero configurar `.env.local` y `.dev.vars` con el mismo proyecto/origen de
pruebas. No usar un paquete construido con las variables ficticias de los tests
para desplegar con Supabase real.

```bash
cd /home/luzvicent/projects/hunter/app
npm ci
npm run cf:build
npm run cf:preview -- --ip 127.0.0.1 --port 3100
```

Si el puerto es 3100, `NEXT_PUBLIC_APP_ORIGIN` debe ser
`http://127.0.0.1:3100`. La preview usa workerd local, sin publicar nada.
`npm run dev` sigue usando Next para desarrollo habitual. `cf:preview` y
`cf:deploy` consumen el último build: ejecutar siempre `cf:build` con la
configuración definitiva antes. No ejecutar tests dev y build simultáneamente,
porque ambos utilizan `.next`.

### Repetir las pruebas sin credenciales

Estas variables son deliberadamente ficticias y apuntan al proveedor HTTP que
inicia la suite. No crean datos ni envían correo en un proyecto alojado.

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54331 \
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=test-public-key \
NEXT_PUBLIC_APP_ORIGIN=http://127.0.0.1:3100 npm run cf:build
```

Crear `.dev.vars` con esos tres mismos valores y `HUNTER_ENV=preview`,
`HUNTER_INDEXING_ENABLED=false`. Después:

```bash
HUNTER_TEST_RUNTIME=cloudflare npx playwright test --config playwright.auth.config.ts
```

Si no hay navegador instalado, `npx playwright install chromium`. En esta nube
se usó `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium`. La misma suite con
`HUNTER_TEST_RUNTIME` sin definir arranca Next dev.

## Preview alojada, pendiente de acceso

1. Autorizar Cloudflare con `npx wrangler login` en una máquina propia o token
   con alcance mínimo sobre el Worker de pruebas. No pegar el token en el chat.
2. Revisar nombre `spotea-piloto` y cuenta de destino. No reutilizar el
   nombre de un Worker existente. No añadir rutas de un dominio de producción.
3. Obtener el subdominio workers.dev de la cuenta y fijar su URL esperada como
   `NEXT_PUBLIC_APP_ORIGIN`; configurar también las variables runtime. Mantener
   `HUNTER_ENV=preview`, `HUNTER_INDEXING_ENABLED=false`.
4. Configurar ese origen en Supabase Auth, tras autorización de ese cambio alojado.
   Aplicar primero las migraciones aprobadas que requiera el nuevo código.
5. Ejecutar `npm run cf:build` con esos valores, revisar el artefacto y ejecutar
   `npm run cf:deploy` únicamente para el Worker de pruebas autorizado.
6. Confirmar URL real y repetir el recorrido email/alta/retorno/logout, cliente y
   personal, fotos, QR de prueba y ubicación desde móvil. Revisar métricas CPU y
   errores del Worker. La simulación local no acredita el correo alojado.

No hay credenciales disponibles en esta tarea; no se ha ejecutado el paso 5 ni
se proporciona una URL de Cloudflare inventada. La URL de Vercel existente no
muestra automáticamente el trabajo de esta rama.

## Cambio futuro de origen y reversión

En Supabase Auth revisar Site URL y Redirect URLs. Mantener el Vercel actual
permitido durante la transición y añadir exactamente el callback del nuevo
origen (`https://<origen>/auth/callback`); sin comodines globales. Cambiar Site URL
solo cuando se elija el principal, no al preparar una preview. Configurar OAuth
solo si llega a utilizarse: este flujo usa email y cuenta invitada, sin proveedor
OAuth nuevo.

Reconstruir con el nuevo `NEXT_PUBLIC_APP_ORIGIN`; comprobar canonical, OG,
sitemap, compartir y manifest. El manifest usa rutas relativas para `start_url`
e iconos, por lo que no fija Vercel. PKCE depende del navegador donde se solicitó
el enlace; las cookies son del origen. No se trasladan sesiones entre dominios.
Pedir un enlace nuevo en el origen nuevo y verificarlo allí, incluyendo Safari.

Para revertir, mantener o volver a dirigir el acceso público al Vercel anterior
y reconstruirlo con su origen si cambió. Conservar su callback permitido. No
borrar tablas ni resetear Supabase: los datos continúan allí. Las migraciones
son compatibles con el código previo de Hunter; revertir DNS/Worker no revierte
compras o perfiles. Mantener excluido de indexación cualquier origen secundario.
No se ha hecho ningún cambio DNS, de dominio o de plan en esta entrega.

## Coste y cuotas contrastados

Consultado el 17/11/2026 en documentación oficial; no se ha consultado el plan
real de la cuenta ni contratado uno. Workers Free publica 100.000 solicitudes/día,
10 ms de CPU por invocación y 128 MB por isolate. Esos 10 ms pueden ser insuficientes
para SSR Next aunque el build y la preview local funcionen: workerd local no
acredita el límite de CPU alojado. Se requiere medir tráfico y CPU reales.

Workers Standard tiene mínimo de **5 USD/mes por cuenta**, incluye 10 millones de
solicitudes y 30 millones de milisegundos CPU/mes; después, 0,30 USD por millón de
solicitudes y 0,02 USD por millón de milisegundos CPU. Tarifas sin convertir moneda
ni estimar impuestos. La documentación de límites actual publica 64 MiB de
Worker sin comprimir, 20.000 archivos estáticos Free/100.000 Paid y 25 MiB por
archivo. Confirmar al desplegar: no se validó una subida remota ni el plan.

No se añaden servicios R2/Images/KV. Supabase sigue teniendo sus propias cuotas
de base de datos, Storage, transferencia, Auth y correo; revisar el dashboard y
la tarifa vigente de esa cuenta. El callejero OpenStreetMap tiene política de
uso/atribución y no una garantía de servicio para tráfico ilimitado. No se puede
prometer coste cero ni calcular un coste total con los datos disponibles.

## Fuentes oficiales

- [Cloudflare Next.js (flujo actual vinext)](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)
- [Cloudflare: OpenNext manual y soporte](https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/)
- [OpenNext: instalación y preview](https://opennext.js.org/cloudflare/get-started)
- [Código/versiones OpenNext](https://github.com/opennextjs/opennextjs-cloudflare)
- [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Supabase pricing](https://supabase.com/pricing)
- [OpenStreetMap tile policy](https://operations.osmfoundation.org/policies/tiles/)

El dominio de documentación Cloudflare devolvía 403 en esta nube. Se consultaron
los mismos documentos oficiales en el repositorio `cloudflare/cloudflare-docs`,
rama `production`, y la guía de `opennextjs/docs`, mediante raw.githubusercontent.com.

## Informe de ejecución

| Comprobación | Resultado |
| --- | --- |
| `npm run lint`, `npm run typecheck` | Pasan |
| `npm test` | 242 tests, 29 archivos, pasan |
| `npm run build` | Pasa también de forma independiente con variables ficticias |
| `npm run cf:build` | Adaptación y bundle completos, pasan |
| Navegador Next dev | 45 pruebas pasan |
| Navegador workerd (`HUNTER_TEST_RUNTIME=cloudflare`) | 45 pruebas pasan; sesiones y callback incluidos |
| Regreso de login a la ficha y acción privada | Prueba ampliada ejecutada de nuevo en Next y workerd |
| `npx wrangler deploy --dry-run --outdir /tmp/hunter-worker-dry-run` | Pasa; 77 archivos estáticos, Worker 9.334,37 KiB / gzip 1.948,97 KiB |
| `npx supabase test db` | 314 comprobaciones, 15 archivos, pasan en PostgreSQL local |
| `npx supabase db lint --schema public,app --level warning` | Dos avisos previos de variables no usadas; sin nuevos errores |
| `npm run test:integration` | Bloqueado por API local Auth/Storage no disponible; ver documento de lanzamiento |
| Publicación Cloudflare | No ejecutada: `wrangler whoami` sin autenticación |

Los tamaños del empaquetado no son una medición de CPU ni validan el plan remoto.
Los logs de ejecución se conservaron en `/tmp/hunter-launch-*` durante esta sesión;
no se incluyen credenciales ni artefactos de compilación en Git.
