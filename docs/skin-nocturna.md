# Dirección visual: cartelera editorial nocturna

La referencia se traduce en composición, no solo en colores: cabecera compacta,
buscador, categorías con iconos, fotografía con recortes orgánicos, fecha circular
y metadatos sobre cristal. Azul tinta como fondo, verde lima para acciones y encaje, violeta para
descubrir propuestas y azul claro para ubicación. No se usa naranja en la interfaz. Se conserva Hunter.

## Pantallas

- **Introducción**: titular grande con palabra de contorno, fotografía vertical en
  cápsula, selector de tres pasos y llamada de entrada con flecha circular.
  Los pasos cambian imagen y texto y admiten teclado; Empezar abre el acceso real.
- **Inicio**: menú a la izquierda, ciudad central enlazada al mapa y acceso al QR
  de compras. Búsqueda por evento, local, música o barrio, categorías temporales
  y selección demo unificada: un plan destacado y tres resultados compactos con
  fotos, horario y porcentaje. Cada local aparece una sola vez. Las fechas usan
  la noche de servicio de Hunter en Europe/Madrid. El icono de filtros abre el
  panel temporal directamente bajo la cabecera; no cambia gustos ni navega al perfil.
  Los filtros activos comparten estado con las categorías. Ver resultados cierra el
  panel y conserva la selección. Quitar filtros limpia la selección temporal.
  Los locales reales nunca muestran una sección Para ti vacía; si no hay encajes,
  aparecen directamente las propuestas Para descubrir.
- **Eventos demo**: cuatro imágenes distintas, recortes orgánicos, fecha circular,
  zona, título y hora sobre una banda translúcida. Cada cartel abre la ficha.
- **Ficha**: fotografía grande y título superpuesto sobre cristal, metadatos con
  iconos, descripción, galería ampliable y barra inferior de presupuesto/acción.
  El presupuesto del local no es un precio de entrada. Apuntarse no procesa pagos.
- **Galería**: usa fotos reales subidas por cada local. En demos se muestra un
  moodboard de ambiente explícitamente ficticio. Se amplía en diálogo con cierre,
  Escape y controles anterior/siguiente.
- **Mapa**: resultados con miniatura, nombre, zona, música, encaje y distancia;
  desaparecen las frases genéricas que competían con el título. Orden por encaje
  o cercanía (esta última requiere ubicación). Tarjeta seleccionada con foto y
  acceso a la ficha. La entrada desde inicio es compacta y abre la pantalla completa.
- **Navegación**: cinco accesos en una barra ahumada compacta. Menú lateral para
  perfil, puntos y gestión. Se mantienen todos los flujos anteriores.
- **Panel del personal**: conserva tema claro para el uso operativo.

Se mantienen scroll nativo sin barra, foco de teclado visible, movimiento reducido
cuando se solicita y separación del borde seguro inferior en iPhone. No se
representan asistentes de voz, notificaciones, anfitriones o asistentes ficticios.
No se convierte Hunter en una red social.

## Recursos

Los iconos PWA y la marca usan también violeta y lima. En el panel claro el violeta
se oscurece para mantener la legibilidad.

Las cuatro imágenes de `public/images/` se generaron con IA para
Hunter y se sirven localmente. Las escenas de club y directo se han llevado a
iluminación azul/violeta para acompañar la nueva paleta. No requieren acceso a proveedores de fotos. Los
locales reales sin foto mantienen un marcador abstracto; sus fotos propias tienen
prioridad. Las imágenes editoriales solo ambientan la introducción/login o los
locales demo, con identificación explícita.

## Validación

Pruebas móviles de navegación y regresión, además de búsqueda por barrio y título,
categorías, introducción con teclado y galería ampliable. Capturas de portada,
inicio y ficha. Comprobación de desbordamiento a 320 y 768 px. Lint, TypeScript,
pruebas unitarias y compilación de producción.

No requiere migraciones ni cambios en Supabase o administradores.
