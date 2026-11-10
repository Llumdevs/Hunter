# Hunter frente al piloto «Rumbo»

Revisión actualizada el 10 de noviembre de 2026 a partir de las capturas compartidas.
El enlace de Claude está bloqueado por la red (HTTP 403); la revisión visual no
permite comprobar las interacciones que no aparecen en las capturas.

## Implementado en esta entrega

| Función | Implementación |
| --- | --- |
| Porcentaje de encaje | Se muestra el porcentaje calculado por los gustos y pesos existentes. Sin gustos no se inventa un porcentaje. |
| Filtros temporales | Música, ambiente y presupuesto, combinables. Se pueden quitar y no modifican los gustos guardados. |
| Tarjeta del mapa | Selección mediante ratón, toque o teclado, nombre, zona, precio, distancia si hay ubicación, encaje, oferta de esa noche y enlace al local. |
| Procedencia | Campo opcional de hasta 80 caracteres, editable en el perfil privado. |
| Resumen del perfil | Contacto propio, edad propia, procedencia, planes activos apuntados, check-ins, valoraciones y puntos. |
| Feedback | Entre 10 y 2000 caracteres, confirmación de guardado, máximo cinco mensajes por usuario y día. Solo el autor puede leer sus mensajes desde la app. |
| Amigos | Código aleatorio por usuario, enviar solicitud, aceptar, rechazar, cancelar y eliminar amistad. No permite buscar por email ni compartir ubicaciones o planes. Límite de 20 intentos de solicitud diarios, incluidos los inválidos. |
| Valoraciones | De 1 a 5 estrellas y comentario opcional de hasta 500 caracteres. Solo check-ins propios verificados y no marcados; una valoración por visita. Los comentarios son privados. |
| Media del local | Se muestra a usuarios con perfil cuando hay al menos tres valoraciones verificadas; no se publican autores ni comentarios. |
| Puntos del piloto | Se calculan en servidor: 10 por check-in verificado no marcado y 5 por valoración. El cliente no puede escribir puntos ni duplicar una valoración. Sin valor económico. |

Continúan implementados gustos, recomendaciones explicables, mapa esquemático,
prelistas, check-in, canje, panel del local y fotos. El login por enlace y el acceso
de invitado están en la corrección anterior.

## Diferencias y trabajo posterior

- La marca sigue siendo Hunter. «Rumbo» solo es la referencia visual recibida.
- El piloto dice que guarda todo en el navegador; Hunter guarda datos en Supabase.
  No debe copiarse ese aviso porque en Hunter sería falso.
- El mapa usa ahora Leaflet y OpenStreetMap, con zoom, marcadores y permiso de ubicación.
  Hay un mapa sin calles de respaldo si falla el proveedor. No incluye rutas a pie ni navegación giro a giro.
- Amigos es una primera versión de solicitudes y relaciones. No incluye chat,
  sincronización de contactos, notificaciones, ni ver los planes de otra persona.
- La portada no muestra aún chips de filtros activos ni fecha; los filtros están
  en un desplegable accesible. Los puntos aparecen en el perfil, no en una cabecera global.
- Las recomendaciones siguen usando los gustos; la media de valoraciones está en
  la ficha del local, pero todavía no influye en el orden de «También te puede gustar».
- La procedencia se recoge en el perfil, no en el formulario inicial. El acceso por
  teléfono y la recuperación de cuentas de invitado no están implementados.
- Los datos de `supabase/seed.sql` siguen siendo solo locales. La interfaz ofrece además
  cuatro locales y eventos de demostración si la base está vacía, con planes, check-in,
  valoraciones y amigos simulados guardados solo en ese navegador, claramente separados
  de las cuentas y puntos reales. Se reinician desde el menú lateral → Pruebas y datos demo.

## Activación

La nueva migración es `app/supabase/migrations/20261110170000_pilot_social.sql`.
Debe aplicarse al proyecto alojado antes de publicar las pantallas dependientes.
Añade tablas y funciones; no reinicia ni borra la base de datos.

Desde `app`, con el proyecto enlazado y la sesión de Supabase válida:

```bash
npx supabase db push --linked --dry-run
npx supabase db push --linked
```

El acceso de invitado requiere además activar **Anonymous Sign-ins** en el panel
de Supabase. En local se habilita en `supabase/config.toml`; ese archivo no cambia
por sí solo la configuración de Auth del proyecto alojado.

## Validación

- `npm test`: lógica y validación de respuestas.
- `npx playwright test --config playwright.auth.config.ts`: navegador móvil,
  SDK y cookies reales contra un proveedor HTTP simulado. Incluye filtros, mapa,
  perfil, feedback, solicitudes y valoraciones; no envía correos reales.
- `npx supabase test db`: suite pgTAP sobre PostgreSQL local, incluyendo permisos,
  aislamiento entre usuarios, límites, visitas verificadas y puntos no duplicados.
- `npm run lint`, `npm run typecheck`, `npm run build`.

Las pruebas locales no demuestran que la migración o la configuración de Auth
ya estén aplicadas en el proyecto alojado, ni que Vercel haya terminado de desplegar.

## Navegación actual

La barra inferior tiene cinco accesos: Esta noche, Mapa, Escanear QR, Mis planes y Amigos.
Perfil, Salir, Gustos, Valoraciones, Privacidad y Pruebas están en el menú lateral de la
cabecera. El diálogo permite Escape, cierre exterior y devuelve el foco al botón.
