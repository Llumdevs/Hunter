# Publicar el piloto de Spotea en Cloudflare

Rama: `spotea-cloudflare`, basada en `spotea-marca`. Worker configurado:
`spotea-piloto`. La rama incluye el descubrimiento público y su migración SQL.
No se ha publicado aún ni retirado Vercel.

## Conectar desde el panel

En Workers & Pages, crear una aplicación Worker e importar el repositorio
`Llumdevs/Hunter` desde GitHub. Autorizar solo ese repositorio si procede.
Utilizar la configuración OpenNext ya incluida, sin convertir el proyecto a
Pages estático ni ejecutar una conversión automática a vinext.

| Campo | Valor |
| --- | --- |
| Nombre del Worker | `spotea-piloto` |
| Rama para construir este piloto | `spotea-cloudflare` |
| Directorio raíz | `app` |
| Comando de build | `npm run cf:build` |
| Comando de despliegue | `npm run cf:deploy` |
| Node | 24, o versión compatible >=22.12 |

El pipeline debe instalar con `npm ci`. No reutilizar el artefacto local de tests:
contiene variables ficticias. La compilación alojada debe usar los valores reales
del piloto. No seleccionar `main` mientras los cambios estén en revisión.

Configurar estas variables en el entorno de build y, para mantener consistencia,
en la configuración de runtime de ese Worker:

- `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto existente.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: su clave publicable; nunca service_role.
- `NEXT_PUBLIC_APP_ORIGIN`: URL HTTPS exacta de ese Worker, sin rutas.

El origen será `https://spotea-piloto.<subdominio-de-la-cuenta>.workers.dev` si el
nombre está disponible. Comprobar el subdominio real antes de fijar el valor.
No se puede deducir del usuario de GitHub. Cambiar este valor requiere un build
nuevo; no basta con editar variables de runtime.

`HUNTER_ENV=preview` y `HUNTER_INDEXING_ENABLED=false` ya están fijadas en
`wrangler.jsonc`. Conservan el piloto fuera de buscadores. No se configura dominio
propio ni se activa un plan de pago automáticamente. Si Cloudflare requiere un
plan por cuotas o CPU, medir/revisar antes de contratar.

## Antes de probar cuentas y fichas reales

La migración `20261117120000_public_discovery.sql` requiere revisión y aplicación
separada en Supabase alojado. No se ha aplicado desde esta tarea. Consultar el
procedimiento de dry-run en [lanzamiento público](lanzamiento-publico.md).

Para usar email en el origen nuevo, añadir su callback exacto a Redirect URLs de
Supabase Auth tras autorizar ese cambio. Durante la transición, mantener el origen
Vercel permitido y no trasladar Site URL sin decidir el principal. Las cookies
no se comparten entre dominios: pedir un enlace nuevo desde el origen nuevo.

Verificar en el Worker alojado: inicio sin cuenta, filtros, mapa y ubicación,
ficha abierta/cerrada, login y retorno, alta de perfil, invitado, logout,
QR de prueba, acceso de personal y anulación. El resultado local no prueba
SMTP alojado, cuotas CPU del plan ni un iPhone físico.

## Verificación del 20 de noviembre de 2026

- Build Next y empaquetado OpenNext de la versión Spotea: correctos.
- 45 pruebas de navegador en workerd: correctas, incluido callback y sesiones.
- Wrangler deploy --dry-run: correcto; 77 archivos estáticos y bundle gzip de
  1.947,29 KiB. No es una publicación ni una medida de CPU.
- Sin sesión Cloudflare en este entorno: la publicación se realiza al conectar
  la cuenta desde el panel o desde una máquina autenticada.

Documentación ampliada: [Cloudflare](cloudflare.md). Vercel permanece disponible
como reversión; no borrar proyecto ni datos Supabase durante el piloto.
