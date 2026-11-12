# Compartir, acceso y Mis planes

- Las fichas de locales, los planes guardados y las invitaciones ofrecen compartir
  mediante `navigator.share`, dentro del gesto de pulsación. iOS decide los destinos
  según las apps instaladas y los tipos de contenido que admiten. Hunter no puede
  forzar que Instagram aparezca como destino para un enlace.
- Sin Web Share API se copia título, texto y enlace. Si tampoco se permite el
  portapapeles, se muestra un campo seleccionable para copiar a mano. Cancelar la
  hoja nativa no muestra un error ni copia contenido al portapapeles.
- Solo se comparten rutas públicas explícitas: `/local/[id]` o la portada para una
  invitación. Nunca se reutiliza la URL actual con parámetros, fragmentos o códigos
  de autenticación. Los QR de compra y los canjes no se comparten.
- La invitación incluye el código propio en el texto compartido; asociarlo continúa
  siendo una acción expresa del invitado antes de su primera compra validada.
- La flecha de bienvenida se arrastra realmente. Un gesto parcial vuelve al inicio;
  completarlo abre el acceso. También admite toque, Enter y Espacio. La confirmación
  de canjes conserva su deslizador independiente y su comportamiento anterior.
- El menú obtiene en servidor la pertenencia del usuario autenticado a una organización.
  Solo los miembros ven Panel de locales. Ocultarlo no sustituye la autorización RLS
  y del panel, que se mantiene. El acceso público de propietarios continúa en `/locales`.
- Mis planes reúne los accesos a cómo llegar, compartir, escáner, canjes y QR de compra.
  Distingue planes demo de prelistas reales y muestra un único estado vacío cuando no
  hay nada guardado. Un fallo de carga de prelistas se muestra como error, no como lista
  vacía. La ubicación de un local demo se identifica como simulada.

No requiere migraciones ni configurar administradores. Las pruebas usan un proveedor
HTTP simulado y dobles de las APIs de compartir/portapapeles: verifican el contenido y
el gesto, pero no muestran la hoja nativa real ni envían nada a otras personas.
