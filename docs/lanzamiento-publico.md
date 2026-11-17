# Hunter: preparación de la versión pública

Trabajo del 17 de noviembre de 2026, partiendo de `9fd3ef7`, en
`lanzamiento-publico-cloudflare`. No sustituye el Vercel actual ni modifica el
Supabase alojado. La configuración alternativa se explica en [Cloudflare](cloudflare.md).

## Qué puede hacer alguien sin cuenta

La portada muestra el catálogo de esta noche, buscador y filtros temporales. El
mapa también es público; la ubicación es voluntaria. La introducción se conserva
en `/bienvenida`, accesible desde la portada, sin bloquear la exploración.
Navegar no llama a `signInAnonymously` ni crea un usuario en Supabase.

Las fichas mantienen `/local/<uuid>`. Consultan la identidad publicada del local,
no dependen de que aparezca en la lista de esta noche. Muestran horario semanal,
estado actual y disponibilidad de prelista. Un local cerrado conserva su ficha;
un identificador inválido, inexistente o no publicado devuelve 404. Los errores
de catálogo tienen un estado de reintento diferente, sin fingir datos demo.

La lista vacía de esta noche sigue mostrando el catálogo ficticio existente,
claramente identificado como demo. No es evidencia de locales colaboradores.
Una respuesta de error no se convierte en una lista demo. Las fotos de ambiente
demo conservan su identificación; las fichas reales usan fotos publicadas.

Guardar planes, apuntarse, editar gustos persistentes, perfil, historial,
valoraciones, compras, invitaciones y operaciones de personal siguen requiriendo
sesión y permisos. El acceso desde una ficha conserva un regreso interno seguro.
Los filtros públicos no guardan preferencias. El menú sin sesión ofrece entrar,
introducción, información para locales y privacidad; no muestra cerrar sesión.

Se conservan paneles, QR, ofertas, compras validadas, anulaciones, invitaciones y
ranking de prueba. No se han creado administradores ni premios reales. No se
reintroducen puntos por check-in o valoración.

## Datos públicos y permisos

Migración nueva: `app/supabase/migrations/20261117120000_public_discovery.sql`.
Aplicada **solo a la base local** para ejecutar pgTAP.

- `public.public_place(uuid)`, ejecutable por `anon` y `authenticated`, devuelve
  datos de un único local activo, no demo y sin propietario demo. Usa una función
  privada con `SECURITY DEFINER` y `search_path` vacío, filtros explícitos y una
  lista de campos limitada. No acepta el usuario como argumento.
- Devuelve nombre, zona, dirección pública, ciudad, coordenadas, presupuesto,
  música/ambiente, horarios, estado, fotos y afluencia agregada con los umbrales
  existentes. No devuelve perfiles, listas de asistentes, personal, organización,
  solicitudes, correos, compras ni secretos QR.
- Las fichas y metadatos usan un cliente sin cookies ni autorización del visitante:
  ser personal no convierte su local pendiente en una ficha pública.
- Las fotos dejan de conceder SELECT sobre `uploaded_by`; se permiten únicamente
  `id`, `place_id`, `storage_path` y `created_at`, además de las RLS existentes.
- La API de prelista verifica perfil adulto y horario en servidor. Permite
  apuntarse antes de abrir y durante la apertura de la noche de servicio, pero
  no después del cierre o sin horario. Los canjes conservan sus comprobaciones
  existentes. No se amplían permisos de escritura ni se publican locales.

### Aplicación futura en Supabase alojado

Debe revisarse y autorizarse por separado. Desde una terminal Ubuntu/WSL, con el
proyecto correcto ya enlazado y la rama de esta entrega:

```bash
cd /home/luzvicent/projects/hunter/app
npx supabase migration list --linked
npx supabase db push --linked --dry-run
```

Revisar **toda** la lista pendiente: el estado alojado no se ha inspeccionado y
puede contener migraciones anteriores pendientes. Tras aprobación explícita:

```bash
npx supabase db push --linked
```

No ejecutar `db reset` contra el alojado. Desplegar el nuevo código sin esta
migración haría fallar las fichas reales. La función nueva es aditiva; revertir
al Vercel anterior conserva la base. La restricción de fotos requiere que los
clientes seleccionen columnas públicas concretas, como hace Hunter.

## SEO por entorno

`NEXT_PUBLIC_APP_ORIGIN` determina canonical, Open Graph y URLs del sitemap.
Se indexa únicamente con origen HTTPS, `HUNTER_ENV=production` y
`HUNTER_INDEXING_ENABLED=true`. Un Vercel Preview permanece excluido incluso si
se activan esos valores. Por defecto, robots impide rastreo y las páginas llevan
noindex. Esto evita duplicar la futura web principal.

Las fichas demo llevan noindex y no canonical. Sitemap incluye portada, mapa y
locales reales activos; excluye demos y rutas privadas. Las rutas de cuenta y
operativas llevan también `X-Robots-Tag: noindex, nofollow`. Los títulos y
Open Graph de las fichas usan los datos públicos, y solo incluyen imagen cuando
existe una foto del local. No se han inventado eventos estructurados ni imágenes.

Noindex no es control de acceso: la protección sigue en las páginas y Supabase.
El sitemap está limitado a 10.000 locales; antes de superar ese volumen hay que
paginarlo. Mientras no haya catálogo real no se debe activar indexación.

## Comprobaciones y límites

La línea base pasó lint, tipos, 234 tests unitarios, build Next, 39 tests de
navegador con proveedor HTTP simulado y 287 comprobaciones SQL. Solo había dos
avisos de lint SQL sobre variables no usadas de `submit_venue_application`.

La entrega añade pruebas de navegación pública sin cookies ni altas, filtros
transitorios, ficha cerrada, HTTP 404, error de API, metadatos y escritorio;
además de pruebas SQL de permisos públicos, perfil adulto, horarios, fotos y
separación de demos. El informe de ejecución final está en Cloudflare.

`npm run test:integration` se intentó: Auth/Storage local no están disponibles
(`AuthRetryableFetchError: fetch failed`, dos suites sin iniciar; dos aserciones
de catálogo fallan por la misma falta de API). Docker tiene PostgreSQL local,
no el conjunto HTTP de Supabase. No se sustituyó por producción. Pendiente:
arrancar el stack local completo con `npx supabase start` y repetir integración.
Las pruebas SQL sí usan PostgreSQL real y las de navegador usan SDK/cookies
reales contra un proveedor **simulado**, sin envío de correos ni transacciones.

## Antes de invitar a usuarios reales

- [ ] Revisar texto de privacidad: sigue siendo un borrador previo a esta entrega.
- [ ] Confirmar estado y aplicar las migraciones alojadas autorizadas.
- [ ] Tener locales reales, horarios y fotos con permiso; aprobar altas con el
  proceso existente cuando se designe administración. No se configura ahora.
- [ ] Probar permisos con cuentas de cliente y personal de dos locales distintos.
- [ ] Validar en el nuevo origen un enlace de email real, alta de perfil, retorno,
  logout, QR de prueba, compra validada y anulación; sin premios reales.
- [ ] Comprobar SMTP/límites de Supabase: el test simulado no acredita entrega de
  correo. El acceso de invitado es un recorrido distinto y depende de su proveedor.
- [ ] Comprobar mapa, atribución OpenStreetMap, denegación de ubicación y compartir
  nativo en Safari/iPhone. No se garantiza que cada app aparezca en el selector.
- [ ] Medir CPU y uso del Worker antes de decidir plan; no contratar automáticamente.
- [ ] Activar indexación únicamente en el dominio HTTPS principal elegido.
