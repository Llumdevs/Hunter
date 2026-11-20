# Spotea

Nombre elegido el 20 de noviembre de 2026. Se aplica al producto visible:
introducción, acceso, menús, fichas, panel de locales, QR impresos, compartir,
metadatos e instalación en el teléfono.

El wordmark provisional se escribe en minúsculas, con una «o» que combina una
órbita abierta violeta y un punto lima. Mantiene la dirección visual existente;
no añade una nueva pantalla ni modifica recorridos de compra o descubrimiento.
El símbolo se utiliza en favicon, iconos PWA y Apple touch icon. Los PNG se
rasterizan del SVG de la aplicación; el manifest incrementa su versión de iconos.

Los QR ya emitidos conservan el formato técnico HUNTER:PURCHASE y los enlaces
existentes. Se mantienen identificadores de Supabase, almacenamiento local,
variables HUNTER_*, repositorio y dominios actuales para conservar compatibilidad.
No se modifica Supabase alojado ni la configuración de Vercel o Cloudflare.

Para verlo instalado con el nombre nuevo en iPhone puede hacer falta eliminar
el acceso anterior y añadir la nueva preview a la pantalla de inicio desde Safari.
El cambio no acredita disponibilidad de dominio ni registro de marca.

Pendiente de despliegue: la preview anterior fallaba por variables públicas sin
configurar en el entorno Preview de Vercel. Deben revisarse sus tres NEXT_PUBLIC_*
y el origen real de la preview antes de redeploy. Esta entrega no ha comprobado
que esos valores hayan sido corregidos en Vercel.

Verificación: lint y TypeScript pasan; 242 pruebas unitarias y las 45 de navegador
pasan; build de producción Next pasa con variables ficticias locales. Se revisó
la captura de la introducción móvil con el nuevo wordmark. No se ha probado
esta entrega en un despliegue alojado ni en un iPhone físico.
