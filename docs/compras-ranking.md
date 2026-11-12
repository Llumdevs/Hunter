# Compras, invitaciones y ranking del piloto

Esta entrega incluye la rama pendiente `locales-alta`. No configura ninguna
cuenta administradora. Las solicitudes de locales permanecen pendientes;
crear un local demo concede acceso únicamente a su propietario.

## Cómo probar

1. En `/panel`, crear el local demo personal. Abrir **Validar compras**.
2. En otra pestaña de la misma sesión, abrir **Mi QR de compra** desde el menú.
   Elegir el local demo y generar el QR. Caduca en cinco minutos; renovarlo
   invalida los QR anteriores de la cuenta, también los de otros locales.
3. El personal escanea el QR del cliente o pega su código. Tras comprobarlo,
   introduce la referencia del ticket y confirma que ha comprobado el pago.
4. La compra aparece en ambos historiales. El personal puede anularla con motivo.
   Las compras demo siempre dan cero puntos reales.
5. En **Invitar**, copiar el código propio o asociar el de quien te invitó.
   No existen perfiles de amigos, solicitudes, chat ni listado de invitados.
6. En **Ranking mensual**, participar voluntariamente con un alias y abrir el
   ejemplo ficticio para comprobar la clasificación sin datos reales.

El registro es una validación manual del personal; no procesa pagos ni integra
el TPV. No se registra importe, producto ni graduación. El ticket se guarda como
huella SHA-256 normalizada, no como texto ni imagen. No incluir datos personales
en referencias o motivos de anulación.

## Reglas implementadas en servidor

- Diez puntos por compra real validada; solo una premiada por local y noche y
  un máximo de tres por noche de servicio, de 08:00 a 08:00, hora local del local.
  Otras compras pueden registrarse pero dan cero. Comida y refrescos también cuentan.
- No hay puntos por cantidad o importe. El personal no puede generar puntos por
  compras en locales de su propia organización. El propietario sí puede ensayar
  en su demo, siempre con cero puntos.
- Veinte puntos al invitador tras la primera compra real válida del invitado;
  máximo cinco invitaciones premiadas por mes. Asociar un código no premia por sí
  solo. Un único código, antes de cualquier compra real, sin cambios retroactivos,
  autoinvitaciones ni ciclos. Un invitador no recibe bonus si es personal del local
  de esa primera compra.
- Un QR solo admite una compra. Referencias de ticket repetidas en un mismo local
  y día se rechazan, incluso después de anular. Se normalizan espacios exteriores
  y mayúsculas. Los reintentos con el mismo identificador de operación son idempotentes.
- Una anulación retira los puntos de compra y de invitación asociados. Si existe
  otra compra válida, la invitación puede calificarse por esa compra, respetando
  el cupo de su mes. No se reparten retroactivamente puntos a otras compras que
  dieron cero por cupos ni a otras invitaciones que excedieron el límite.
- Los meses se calculan en Europe/Madrid. Clasificación de hasta 50 participantes,
  con empates compartiendo posición. Mes actual y doce meses anteriores consultables.
  Solo alias y puntos públicos para usuarios autenticados. Salir oculta el alias
  también de rankings anteriores. Las anulaciones pueden corregir meses anteriores.
- Premio ficticio: dos entradas a una experiencia cultural. Sin patrocinador,
  entrega real, ganador asignado automáticamente ni premio ligado al alcohol.
- Check-ins, canjes y valoraciones siguen funcionando pero ya no otorgan puntos.
  El total anterior se congela al aplicar la migración y se muestra como histórico,
  excluido del ranking. Las amistades antiguas se conservan pero sus APIs se revocan.

Las mutaciones de puntos se serializan mediante un bloqueo transaccional global,
una elección sencilla para el volumen del piloto. Antes de escalar conviene
sustituirlo por bloqueos por cuenta/cupo y añadir controles antifraude operativos.
La posesión de un código no demuestra que dos invitados sean personas diferentes.

## Activación alojada

Aplicar las migraciones antes de promover la rama a `main`. No ejecutar resets
contra el proyecto alojado:

```bash
cd ~/projects/hunter
git fetch origin
git switch --track origin/compras-ranking
cd app
npx supabase db push --linked --dry-run
npx supabase db push --linked
```

Si `locales-alta` sigue pendiente, aparecen
`20261110180000_venue_onboarding.sql` y
`20261112120000_purchase_rewards.sql`. Si la primera ya estaba aplicada, solo la
segunda. No hace falta SMTP, dominio propio ni configurar administradores.

## Verificación

Tests SQL reales: permisos, QR caducado/rotado/reutilizado, idempotencia, tickets,
propietarios demo, personal, cupos de compra e invitación, reversión y recalificación,
ciclos, privacidad, alias, meses y ausencia de administradores. Tests de navegador
con proveedor HTTP simulado: QR de cliente, validación y anulación demo, consentimiento
del ranking, invitaciones y regresiones de login, mapas y alta de locales.
Las pruebas no verifican el proyecto alojado ni integraciones de cobro.
