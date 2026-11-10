# Comparación de Hunter con el piloto «Rumbo»

Revisión del 10 de noviembre de 2026. Basada en las seis capturas aportadas
(una repetida) y en el código de Hunter. El enlace de Claude no pudo abrirse:
el proxy del entorno devuelve HTTP 403. Las capturas muestran pantallas;
no demuestran que todas sus funciones estén implementadas en el artifact.

## Diferencia de alcance

El piloto declara que guarda los datos solo en el navegador y usa locales y ofertas
de ejemplo. Hunter tiene autenticación, base de datos, políticas de acceso,
funciones de check-in y canje, y panel del local. No hay que sustituir ese backend
por almacenamiento local ni copiar el aviso de que «no se envían datos a ningún servidor»:
en Hunter sería falso. «Rumbo» es la marca de la referencia, no un cambio de nombre aprobado.

## Qué está y qué falta

| Elemento visible | Estado en Hunter | Trabajo pendiente |
| --- | --- | --- |
| Preferencias de música, ambiente y presupuesto | Implementadas y persistidas; además se pueden elegir rangos de edad | Ajustar textos y presentación si se quiere acercar al piloto |
| «Para ti» y explicación del encaje | Implementados con pesos configurables y tests | Mostrar el porcentaje calculado: hoy la tarjeta muestra «Encaja» |
| «También te puede gustar» | Implementado por menor coincidencia con los gustos | El texto del piloto promete buenas valoraciones; faltan valoraciones y su uso en este orden |
| Minimap y mapa con colores, ubicación y distancias | Implementados con coordenadas reales | Son esquemáticos, sin calles ni barrios dibujados; el piloto tiene un fondo ilustrado. Un mapa navegable real requeriría otra implementación |
| Tocar un punto y ver una tarjeta sobre el mapa | Parcial | Hoy el punto abre la ficha directamente; falta selección del punto, tarjeta superpuesta, oferta y botón «Ver el local» |
| Filtros y chips en «Esta noche» | Parcial | Hay acceso a editar gustos; faltan filtros temporales de esa noche, chips activos y fecha visible |
| Mis planes, apuntarse, check-in y canje | Implementados | Las capturas no muestran el detalle de Mis planes; no se puede comparar ese flujo completo |
| Amigos y aviso «1» | Ausente | Faltan pantalla, relaciones, invitaciones, solicitudes y permisos de visibilidad. La captura solo permite confirmar la pestaña y el distintivo |
| Puntos | Ausente | Faltan reglas de obtención, registro de movimientos y contador. No es suficiente mostrar un número fijo |
| Valorar la noche | Ausente | Faltan formulario, almacenamiento, permisos, comprobación de visita y agregados |
| Perfil con contacto, edad, procedencia y contadores | Parcial | Hay nombre, gustos, cuenta y acceso al panel. Faltan ciudad/procedencia, resumen de contacto y edad, y contadores. Planes y check-ins ya tienen datos de los que derivarlos |
| «Tu opinión sobre el piloto» | Ausente | Falta formulario y persistencia del feedback, con confirmación de envío |
| Registro con email o teléfono | Parcial | Email implementado; teléfono no. El piloto no demuestra que verifique ninguno de los dos |
| Acceso sin depender del correo | Preparado en este cambio | «Probar sin correo» usa usuarios anónimos de Supabase; debe habilitarse Anonymous Sign-ins en el proyecto alojado |

Evidencia principal: `app/src/app/tonight-view.tsx`, `app/src/app/mapa/map-view.tsx`,
`app/src/components/tonight/minimap.tsx`, `app/src/components/tonight/venue-card.tsx`,
`app/src/lib/tonight/recommend.ts`, `app/src/app/perfil/page.tsx`,
`app/src/app/perfil/gustos/preferences-form.tsx`, `app/src/app/planes/page.tsx`,
`app/src/components/tab-bar.tsx` y `app/supabase/migrations/`.

## Orden propuesto para las pruebas

1. Activar el acceso de invitado, desplegar la corrección del login y probar el alta
   con un navegador nuevo. Para correo abierto a destinatarios externos sigue haciendo
   falta un servicio de envío o un proveedor de acceso alternativo.
2. Comprobar que la base alojada tiene locales de prueba y horarios. Aplicar migraciones
   no carga `supabase/seed.sql`; ese archivo está marcado para desarrollo local.
   No ejecutar `db:reset` en remoto ni cargar el seed local en producción.
3. Añadir feedback del piloto, porcentaje de encaje y tarjeta de local sobre el mapa.
   Son mejoras útiles para validar la propuesta sin depender de construir la red social.
4. Añadir valoraciones verificadas; después usarlas en las recomendaciones.
5. Definir las reglas de Amigos y puntos antes de crear sus tablas y pantallas.

Esta revisión no implementa las funciones pendientes ni verifica sus pantallas en producción.
