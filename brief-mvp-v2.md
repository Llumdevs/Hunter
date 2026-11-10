# Hunter · Brief de producto y desarrollo del MVP — v2

> **Hunter** es el nombre elegido (sustituye a «Rumbo», que chocaba con la marca de viajes rumbo.es). Falta comprobar marca y dominios: ver §13.
> Este documento parte del brief v1 de Raúl e incorpora las decisiones tomadas el 9 de noviembre de 2026.
> Lo que aparece como "propuesta" sigue siendo un punto de partida, no una decisión cerrada.

---

## 0. Qué cambia respecto a la v1

| # | Cambio | Motivo |
|---|---|---|
| 1 | **El lanzamiento se hace en Fallas** (del 1 al 19 de marzo de 2027) con una guía de verbenas y planes falleros, y el producto de bares va dentro | Fallas es el mayor pico de demanda del año y la mejor campaña para conseguir usuarios. El público Erasmus de febrero es pequeño: solo en la UPV llegaron unos 650 en el segundo semestre del curso 2024/25 |
| 2 | **El público no es solo Erasmus**: universitarios locales, gente joven y, después, público de más de 30 | Los universitarios locales no se van a los 5 meses, y en Fallas sale gente de todas las edades |
| 3 | **La edad pasa a ser un filtro y un criterio de recomendación** ("busco gente de mi edad") | Es el dato diferencial del producto: saber qué gente va antes de ir |
| 4 | **Check-in mixto**: lo hace el usuario con un QR fijo o dinámico; el canje es presencial y **se cobra el canje**, no el escaneo | Así ni el local puede evitar el cobro ni un QR fotografiado genera cobros falsos |
| 5 | **No hay app nativa para locales.** El panel web tiene un "modo pantalla" con un QR que cambia cada 30 s y un "modo puerta" para validar entradas | Da la misma seguridad sin desarrollar ni distribuir una app más |
| 6 | **Entradas para verbenas falleras**, solo si alguna falla firma antes del 15 de enero | Es un ingreso y un caso de prueba, pero añade pagos y devoluciones: es el bloque de más riesgo |
| 7 | El modelo de datos separa **lugar, evento y sesión** | Una carpa fallera, un bar y la programación de un club no caben en una única tabla `venues` |
| 8 | Las ofertas **no pueden ser solo alcohol** y llevan un aviso de salud cuando lo sean | Ley 10/2014 de Salud de la Comunitat Valenciana (arts. 66 y 68) y la tendencia de otras comunidades (Galicia, Ley 6/2025) |

---

## 1. La idea en 30 segundos

Una app para saber **cómo es un sitio o un plan antes de ir**: qué gente va (edad), qué música suena, cuánto cuesta, qué ambiente tiene y cómo de lleno está esta noche.

- **El usuario** descubre planes que encajan con sus gustos y con su edad (bares, música en directo, discotecas y, en Fallas, verbenas y carpas), se apunta a una **prelista** y, a cambio, recibe una **oferta** cuando llega.
- **El local** recibe clientes nuevos, sabe cuánta gente va a venir antes de abrir y **paga solo por los clientes que entran y canjean la oferta**.
- **La falla** (en la campaña de Fallas) da a conocer su verbena y, opcionalmente, vende entradas.

**Lo que le vendemos a cada uno:**
- Al usuario: **acertar** con el sitio.
- Al local: **pagar solo por quien entra**, sobre todo en las **noches flojas**.
- A la falla: **más público y venta de entradas sin complicaciones**.

---

## 2. Para quién es

### Usuarios
- **Público inicial:** universitarios (locales y Erasmus) y gente joven de 18 a 30 años.
- **Ampliación desde marzo:** público de más de 30 años que busca bares tranquilos (Ruzafa, El Carmen).
- **Una sola app** con la edad como filtro, no productos separados por edades.
- **Idiomas:** español e inglés desde el primer día.

### Zona
- Valencia ciudad: Ruzafa, El Carmen y Benimaclet o Cánovas.
- En Fallas, las fallas de esos barrios y sus alrededores. No hace falta cubrir toda la ciudad, pero sí que la zona cubierta esté completa.

### Clientes de pago
- **Locales:** de 10 a 15 "locales fundadores", que entran gratis y con el precio bloqueado.
- **Fallas:** de 1 a 3 comisiones con venta de entradas en la campaña de 2027 (opcional, según §12).

### Cómo se lo vendemos a los locales
- **En Fallas no se les cobra**: se llenan solos. Fallas es el escaparate.
- **Después de Fallas:** "te llenamos el martes, el miércoles y el jueves". La oferta y el cobro tienen sentido en las noches flojas.

---

## 3. El flujo central

### 3.1 Bares y locales

```
1. PRELISTA        →  2. CHECK-IN               →  3. CANJE                 →  4. VALORACIÓN
   (intención)         (asistencia real)            (lo que se cobra)          (ambiente)
   El usuario se       El usuario escanea el QR     Delante del camarero,      Al día siguiente,
   apunta desde        del local (fijo o de          el usuario desliza         3 preguntas
   la app              pantalla) → se desbloquea     "Canjear" → pantalla       rápidas
                       la oferta                     animada no falsificable
```

**Reglas clave:**
- **El check-in lo hace siempre el usuario, nunca el local.** Así el local no puede saltarse el registro para no pagar.
- **Se cobra el canje**, no el escaneo. Un QR fotografiado por alguien que no está en el local desbloquea una oferta que no puede canjear, así que no genera ningún cobro.

### 3.2 Verbenas falleras

```
1. DESCUBRIR / APUNTARSE    →  2. (OPCIONAL) ENTRADA        →  3. ACCESO               →  4. VALORACIÓN
   Mapa y calendario de          Pago en la app (§7.4)           El personal de la falla     Igual que en los
   verbenas, filtros por         o enlace a su venta             escanea el QR de la         bares
   música, edad, precio          actual                          entrada (modo puerta)
```

En las verbenas con entrada, **quien escanea es la falla**. En este caso es lo correcto: la falla ya ha cobrado y quiere controlar su aforo, así que no tiene ningún motivo para no escanear.

### 3.3 Qué significa cada dato

| Dato | Qué significa | Para qué se usa |
|---|---|---|
| Apuntados | Intención (va inflado) | Efecto llamada y previsión |
| Check-ins | Presencia | Afluencia mostrada y detección de fraude |
| Canjes | Cliente que entra y usa la oferta | **Lo que se cobra al local** |
| Entradas validadas | Asistencia a la verbena | Comisión por entrada y datos de la falla |
| Valoraciones | Ambiente percibido | Etiquetas, ranking y recomendaciones |

---

## 4. Alcance

El alcance se divide en dos entregas porque el plazo es corto:

- **Entrega A (antes del 1 de marzo, imprescindible):** guía de Fallas, cuentas, preferencias y el flujo de bares para los locales fundadores.
- **Entrega B (antes del 1 de marzo, condicionada):** venta de entradas, solo si alguna falla firma antes del 15 de enero.

### 4.1 App del usuario (PWA), entrega A
1. Registro e inicio de sesión: código por email o SMS (sin contraseña) y fecha de nacimiento para comprobar que es mayor de 18.
2. Onboarding de gustos: música, ambiente, presupuesto y **edad del público que busca**. Se puede saltar.
3. **"Esta noche"**: minimapa, "Para ti" y "También te puede gustar". En Fallas incluye las verbenas de la noche.
4. **Modo Fallas** (activo del 1 al 19 de marzo; se activa por configuración):
   - Mapa y calendario de verbenas, carpas abiertas al público y actos destacados.
   - Filtros: día, música (orquesta, DJ, reggaetón, pachangueo...), precio (gratis o de pago), edad del público y distancia.
   - Ficha con horario, acceso (libre, con entrada o solo falleros), fuente y fecha de verificación.
5. Mapa a pantalla completa.
6. Ficha del local o del evento con el botón "Apuntarme".
7. "Mis planes": prelistas, escáner de QR dentro de la app, oferta desbloqueada y canje.
8. Valoración al día siguiente (ver §5.6).
9. Contador de puntos (el canje de puntos queda fuera).

### 4.2 Panel del local (web), entrega A
1. Ficha: nombre, fotos, horario, tipo, programación por día (música y ambiente), precio, etiquetas y **edad del público según el local**.
2. Crear, editar y **pausar** la oferta, con días activos. Se aconsejan ofertas para las noches flojas.
3. Cifras del día: apuntados, check-ins, canjes y previsión.
4. Gráfica semanal: apuntados, check-ins y canjes.
5. Perfil agregado del público (mínimo de muestra en §8).
6. **Mi QR:** QR fijo para imprimir y **"modo pantalla"** con un QR que cambia cada 30 s.
7. **Lo que se cobraría:** canjes que se cobrarían, con sus pruebas, aunque durante el piloto no se facture.

### 4.3 Panel de la falla (web)
- **Entrega A:** ficha de la falla y alta y edición de sus verbenas y actos. Si la falla no lo hace, lo hacemos nosotros desde el admin.
- **Entrega B:** venta de entradas (cupo, precio y fechas) y **"modo puerta"**, que escanea entradas con la cámara del móvil desde la web.

### 4.4 Admin interno
- Alta de locales, fallas y cuentas.
- **Gestión del catálogo de Fallas**: alta de eventos, estados (pendiente, verificado o cancelado), fuente, detección de duplicados y registro de cambios de horario.
- Métricas globales y alertas antifraude (§7.3).
- Medición de los **minutos de mantenimiento por evento** (riesgo señalado en el plan de negocio).

### 4.5 Fuera del MVP
- Reservas de mesa, integración con el TPV, stock y previsión de ventas.
- Facturación automática a locales (se hace a mano).
- Previsión de afluencia con modelos predictivos.
- Canje de puntos.
- Rutas encadenadas (previa, bar, discoteca).
- Otras ciudades.
- Chat, perfiles sociales y seguidores.
- **App nativa para el usuario o para el local**: se valorará después de Fallas según la retención.
- **Ticketera propia para locales**: solo hay entradas para fallas y solo en la entrega B.

---

## 5. Pantallas

Prototipo de referencia: https://claude.ai/artifact/DimFbaQcSVBucxVdp6RdpD (Raúl tiene que compartirlo).
**Hay que añadir al prototipo:** el selector de edad en Gustos, el modo Fallas y la pantalla de canje.

### 5.1 Gustos
- **Música:** Reggaetón, Techno, House, Pop, Indie/rock, Jazz/soul, Flamenco/rumba, Orquesta/pachangueo (lista ampliable).
- **Ambiente:** Para bailar, Para hablar, Música en directo, Previa, Verbena.
- **Presupuesto:** €, €€, €€€.
- **Gente de:** 18-24 · 25-30 · 30-40 · +40 · Me da igual (selección múltiple).
- Se puede saltar este paso. En ese caso se muestran los planes más valorados.

### 5.2 Esta noche
- Igual que en la v1: minimapa con verde lima (encaja), naranja (descubrir) y azul (usuario).
- En Fallas, las verbenas aparecen con un icono propio en el minimapa.
- **No se muestra el porcentaje de afinidad, solo el motivo.** Un "100 %" calculado con 4 atributos aparenta una precisión que no existe y genera desconfianza cuando falla.

### 5.3 Mapa
- Igual que en la v1, con un filtro rápido "Bares · Verbenas · Todo".

### 5.4 Ficha del local o del evento
- La v1, más el **"Público: mayoría 25-35"** destacado (dato propio o marcado "Según el local").
- Programación de esta noche (la música y el ambiente cambian según el día).
- La oferta indica "se activa con el check-in y se canjea en barra".
- Si la oferta incluye alcohol, se muestra un aviso de salud visible (§8.4).

### 5.5 Mis planes y canje
- Lista de las prelistas y entradas de hoy.
- El botón **"Escanear QR del local"** abre el escáner **dentro de la app**. Así se evita el problema de iOS de abrir Safari sin sesión iniciada.
- Tras un check-in válido, la oferta aparece desbloqueada y **válida toda la noche**.
- Botón **"Canjear"**: el usuario lo desliza delante del camarero y aparece una **pantalla de canje** con:
  - Hora en vivo con segundos y un fondo animado, para que no sirva una captura.
  - Nombre del local, la oferta y el número de canje.
  - Validez de 15 minutos desde que se pulsa "Canjear".
  - Letra grande y mucho contraste, fácil de enseñar en la barra.
- **Entradas de verbena**: QR de la entrada para que lo escanee el personal de la falla.

### 5.6 Valoración
- Se pide solo a quien ha hecho check-in o ha validado su entrada.
- **En iOS, las notificaciones de una PWA solo llegan si está instalada**, así que la valoración se pide por varias vías:
  1. Notificación a las 12:00, si está instalada.
  2. Tarjeta al volver a abrir la app.
  3. Email al día siguiente (solo con consentimiento según la LSSI; ver §8.4).
- Preguntas: Ambiente (Tranquilo, Animado, A tope) · ¿La música era la esperada? (Sí, Más o menos, No) · ¿Volverías? (Sí, Quizá, No) · Comentario opcional.

### 5.7 Panel del local
- La v1, más canjes, el modo pantalla y lo que se cobraría.

### 5.8 Modo puerta (fallas, entrega B)
- Página web a pantalla completa que usa la cámara del móvil del personal.
- Respuesta inmediata (verde: válida; rojo: ya usada o no válida), con sonido y vibración.
- **Funciona sin conexión**: descarga antes la lista de entradas firmadas y sincroniza los escaneos al recuperar la conexión.

---

## 6. Lógica de recomendación (MVP)

```
puntos = 0
si la música de esta noche está en los gustos               → +2
si el ambiente de esta noche está en los gustos             → +2
si el rango de edad mayoritario coincide con lo que busca   → +2
si el precio está en los gustos                             → +1

máximo = suma de los pesos de los criterios que el usuario ha rellenado
encaje = puntos / máximo

"Para ti"                  → encaje >= umbral (0,6), ordenados por encaje y luego por valoración
"También te puede gustar"  → el resto, ordenados por encaje y valoración; máximo 3
```

**Motivo que se muestra:**
- Música y ambiente → "Encaja con tu música y con el ambiente que buscas".
- Música, ambiente y edad → "Tu música, tu ambiente y gente de tu edad".
- Solo la música → "Tu música, en otro tipo de ambiente".
- Solo el ambiente → "El ambiente que buscas, con otra música".
- Solo la edad → "Gente de tu edad, otro estilo".
- Nada → "Algo distinto: lo valoran muy bien esta semana".

**Notas:**
- Los pesos y el umbral se pueden cambiar por configuración (tabla `config`), sin desplegar una versión nueva.
- La música y el ambiente salen de la **programación de esa noche**, no de una etiqueta fija del local.
- **De dónde sale la edad del local:** de los check-ins si hay muestra suficiente (§8); si no, del dato del local, marcado "Según el local".
- Si el usuario elige "Me da igual", la edad no puntúa ni cuenta en el máximo.
- La distancia no puntúa en el MVP; solo se muestra.

---

## 7. Check-in, canje, entradas y antifraude

### 7.1 Check-in en bares: reglas para que sea válido
1. **No hace falta prelista previa.** Si el usuario no estaba apuntado, se crea en ese momento y se marca como "espontáneo". La prelista no aportaba seguridad, porque uno se puede apuntar en la puerta en 3 segundos.
2. El QR corresponde a ese local:
   - **QR fijo:** `https://<dominio>/c/<venue_id>?k=<token>`. Se usa el **id, nunca el slug**, para que el QR impreso siga sirviendo aunque el local cambie de nombre. El token se puede invalidar si hace falta.
   - **QR de pantalla:** `https://<dominio>/c/<venue_id>?t=<código>`. El código cambia cada 30 s y se calcula como `HMAC(secreto_del_local, floor(hora/30))`. **Se calcula en el navegador del local sin conexión.** El servidor acepta el código actual y el anterior.
3. Dentro del horario de apertura del local.
4. Ubicación como respaldo: el usuario debe estar a **menos de 150 m** (configurable).
   - Si el usuario no da permiso de ubicación, se acepta el check-in y se muestra la oferta, pero se marca `geo_ok = false` y **en el piloto no se cobra**. Hay que medir qué porcentaje de casos son.
5. **Un solo check-in por usuario, local y noche.**
6. "Noche": de 18:00 a 08:00, asignada a la fecha en que empieza, en hora `Europe/Madrid`. El cálculo se hace en la base de datos (§9).
7. **Todas estas reglas se validan en el servidor**, con una función. El cliente nunca escribe directamente en `checkins`.

### 7.2 Canje: lo que se cobra
- Requiere un check-in válido esa noche y una oferta activa.
- **Un canje por check-in.**
- Válido durante 15 minutos desde que se pulsa "Canjear".
- **Se cobra** un canje con `geo_ok = true` y de un **cliente nuevo** para ese local, es decir, su primer canje allí. El precio para clientes que repiten se decidirá más adelante (ver §13).
- Cada canje guarda sus **pruebas**: hora, distancia, tipo de QR (fijo o de pantalla) y la oferta tal como era en ese momento.

### 7.3 Señales de alerta para el admin
- Un local con muchos apuntados y casi ningún check-in, comparado con la media de su zona.
- Un local con muchos check-ins y casi ningún canje (posible QR compartido).
- Check-ins imposibles por distancia y tiempo (dos locales lejanos en muy pocos minutos).
- Picos de altas nuevas en un mismo local la misma noche (posibles cuentas falsas).
- Porcentaje alto de check-ins sin ubicación.

### 7.4 Entradas de verbena (entrega B)
- **Opción por defecto:** enlace a la venta que la falla ya tenga, y apuntarse sin pago en la app.
- **Opción con pago** (solo si una falla la firma):
  - Pago con **Stripe Connect**: la falla tiene su propia cuenta conectada, cobra directamente y nosotros nos quedamos una comisión por entrada. **Así no custodiamos dinero de terceros.**
  - **La falla es la organizadora** y la responsable del evento, del aforo y de las devoluciones. Nosotros somos intermediarios, y así debe constar en las condiciones.
  - Entrada = QR firmado por el servidor y de un solo uso, que se valida en el modo puerta (§5.8).
  - Cancelación por lluvia o fuerza mayor: la política de devoluciones la decide la falla y se muestra antes de comprar.
  - **Validar con un abogado** las condiciones de venta, la información obligatoria al consumidor y el régimen de desistimiento en eventos con fecha concreta.

---

## 8. Datos, privacidad y cómo se muestran

### 8.1 Qué pedimos al usuario
- Nombre.
- **Fecha de nacimiento**: para comprobar que es mayor de 18 y calcular el rango de edad agregado. Es una **declaración del usuario, no una verificación de identidad**, y así debe constar en las condiciones.
- Teléfono o email.
- Opcional: ciudad de origen.

### 8.2 Reglas para mostrar datos
- **Edad:** siempre en **rangos** ("mayoría 25-35"), nunca una media exacta.
- **Muestra mínima:** no se muestran datos de edad ni de ambiente basados en check-ins hasta tener **entre 15 y 20 check-ins** (configurable). Hasta entonces se muestra el dato del local, marcado "Según el local".
- **Número de apuntados:** solo a partir de un umbral (por ejemplo, 15). Por debajo, "Se está animando" o nada.
- **El local y la falla nunca ven datos individuales**, solo agregados.
- **La muestra mínima se aplica en el servidor**, con vistas o funciones, no en la interfaz. Si no, un local podría pedir su perfil de público con 2 personas y averiguar quiénes son.

### 8.3 RGPD
- Consentimiento claro en el registro y política de privacidad visible.
- Borrado de la cuenta y de los datos desde la propia app.
- Servidores en la UE.
- **Evaluación de impacto (EIPD)**: probablemente obligatoria por combinar ubicación, hábitos de ocio y perfilado. Hacerla antes del lanzamiento.
- **Datos sensibles por deducción**: un historial de check-ins en locales con ciertas etiquetas (por ejemplo, LGTBI-friendly) permite deducir datos de categoría especial (art. 9 del RGPD). Por eso:
  - Se borran la latitud y la longitud de los check-ins a los **30-90 días** y solo se conservan `distance_m` y `geo_ok`.
  - Nunca se ceden datos de esas etiquetas, ni siquiera agregados, sin evaluarlo antes.

### 8.4 Comunicaciones y alcohol
- **LSSI (art. 21)**: las ofertas por notificación o email requieren un **consentimiento específico**, separado de la aceptación de las condiciones.
- **Ley 10/2014 de Salud de la Comunitat Valenciana**:
  - **Art. 66.1.a**: si la oferta incluye una bebida alcohólica, se muestra un aviso de salud visible.
  - **Art. 66.1.b**: los textos no pueden asociar el alcohol al éxito social o sexual ni incitar al consumo abusivo. Esto afecta a las ofertas y a nuestro marketing.
  - **Art. 66.2**: nada dirigido a menores. Por eso la comprobación de +18 es obligatoria.
  - **Art. 68.2**: prohibido estimular el consumo a base de competir. **Los puntos nunca dependen de consumir alcohol**: nada de retos ni rankings de copas.
- **Criterio de producto**: se recomiendan ofertas que no sean solo alcohol (entrada reducida, tapa, refresco, sin cola, mesa garantizada). Así funcionan igual en otras comunidades, donde la regulación es más estricta (Galicia, Ley 6/2025, art. 20.5).
- **Pendiente**: comprobar si ha avanzado la ley estatal de alcohol y menores (expediente 121/000050 del Congreso).

### 8.5 Seguridad
Este proyecto es **N2 (crítico)** según el protocolo de calidad, porque se cobra con los canjes y hay datos personales y de ubicación.
- RLS en todas las tablas, **con tests por cada rol**: usuario, personal del local, personal de la falla y admin.
- **Check-in, canje y validación de entradas solo mediante funciones del servidor.** El cliente no tiene permiso de escritura en `checkins`, `redemptions`, `tickets`, `points_ledger` ni `ratings`.
- La clave de servicio nunca está en el cliente. Los secretos de los QR se guardan solo en el servidor; el modo pantalla recibe su secreto en una sesión autenticada del local.
- Límite de peticiones en el registro, el inicio de sesión, el check-in y el canje.
- Registro de auditoría en las acciones de cobro.
- **Antes del lanzamiento:** revisión manual de autenticación, permisos y endpoints, y **revisión externa** si es posible.

---

## 9. Modelo de datos (propuesta v2)

```
cities
  id, name, timezone ('Europe/Madrid')

users
  id, name, email, phone, birthdate, origin_city?, locale (es/en),
  consent_marketing (bool), consent_marketing_at, created_at, deleted_at
  -- los puntos NO se guardan aquí: se calculan a partir de points_ledger

user_preferences
  user_id, music[], vibe[], price[], age_bands[]       -- age_bands: '18-24','25-30','30-40','40+'

organizers                                            -- quien gestiona: un local o una falla
  id, kind (venue_owner | falla), name, legal_name?, cif?,
  stripe_account_id?, created_at

organizer_members
  organizer_id, user_id, role (owner | staff), created_at

organizer_invites
  id, organizer_id, email, role, token, expires_at, accepted_at?

places                                                -- un lugar físico
  id, city_id, organizer_id, kind (bar | club | directo | carpa | ...),
  slug, name, zone, address, location (geography Point, PostGIS),
  photos[], is_active, is_founder,
  base_age_band?,                                    -- dato del local
  opening_hours (json por día, admite cierres después de medianoche)

place_programming                                     -- qué hay cada día de la semana
  place_id, weekday, music, vibe, price, valid_from, valid_to?

events                                                -- verbena, concierto o acto puntual
  id, city_id, place_id?, organizer_id?, title, kind (verbena | concierto | acto | ...),
  location?,                                         -- si no tiene place (acto en la calle)
  starts_at, ends_at, music, price_from?, access (libre | entrada | privado),
  source_url, verified_at?, status (pendiente | verificado | cancelado),
  external_ticket_url?

qr_codes
  place_id, static_token, totp_secret (solo en el servidor), revoked_at?

offers
  id, place_id, title, description, includes_alcohol (bool),
  days_of_week[], valid_until_time?, max_redemptions?,
  is_active, created_at

signups                                               -- prelista
  id, user_id, place_id?, event_id?, night_date, is_spontaneous (bool),
  created_at, cancelled_at
  UNIQUE (user_id, place_id, night_date)              -- prelista a un local
  UNIQUE (user_id, event_id)                          -- prelista a un evento
  CHECK (exactamente uno de place_id / event_id)

checkins
  id, user_id, place_id, signup_id, night_date, created_at,
  qr_kind (static | screen), lat?, lng?, distance_m?, geo_ok, flagged
  UNIQUE (user_id, place_id, night_date)
  -- lat/lng se borran a los 30-90 días

redemptions                                           -- lo que se cobra
  id, checkin_id UNIQUE, offer_id, offer_snapshot (json),
  is_first_visit (bool), billable (bool), created_at, expires_at

ticket_types                                          -- entrega B
  id, event_id, name, price_cents, quota, sales_start, sales_end

tickets
  id, ticket_type_id, user_id, payment_ref, status (pagada | usada | reembolsada),
  qr_signature, used_at?, used_by_member?

ratings
  id, user_id, place_id?, event_id?, checkin_id?, ticket_id?,
  vibe, music_match, would_return, comment?, created_at

points_ledger
  id, user_id, amount, reason (checkin | rating | ...), ref_id, created_at

config
  key, value                                          -- pesos, umbrales, radio, modo Fallas...
```

**Notas:**
- `night_date` se calcula con una función de la base de datos, no en el cliente:
  `((created_at AT TIME ZONE cities.timezone) - interval '8 hours')::date`.
  Hay que decidir explícitamente qué se hace con la franja de 08:00 a 18:00 ("tardeo" y actos de Fallas de día).
- `is_first_visit` se calcula en el servidor: no hay ningún canje anterior de ese usuario en ese lugar.
- `offer_snapshot` guarda la oferta tal como era al canjearla, por si el local la edita a mitad de noche.
- La edad mayoritaria de un lugar se calcula con una vista agregada que solo da resultado si hay al menos N check-ins (umbral en `config`).

---

## 10. Métricas desde el primer día

| Métrica | Fórmula | Objetivo |
|---|---|---|
| Tasa de check-in | check-ins / apuntados | > 30-40 % |
| **Tasa de canje** | canjes / check-ins | Alta. Si es baja, puede haber un QR compartido |
| **Clientes nuevos** | canjes de primera visita / canjes | > 50 % (si no, el local paga por sus habituales) |
| Repetición de usuarios | usuarios con check-in en 2 o más semanas distintas / usuarios con check-in | Que crezca |
| **Retención después de Fallas** | usuarios captados en Fallas activos en abril / usuarios captados en Fallas | **Métrica decisiva de la v2** |
| Tasa de valoración | valoraciones / check-ins | > 40 % |
| Canjes por local y mes | por local | Umbral para empezar a cobrar |
| Minutos de mantenimiento por evento | tiempo del admin / eventos verificados | Que baje |
| Entradas vendidas por falla (entrega B) | por falla | Datos para la propuesta de 2028 |

Basta con consultas SQL o vistas. No hace falta un dashboard al principio.

---

## 11. Stack (propuesta)

- **App del usuario, panel del local y de la falla, y admin:** un solo proyecto **Next.js como PWA**, con rutas separadas por rol.
  - El QR abre la web directamente, sin pasar por las tiendas de apps.
  - Escáner dentro de la app con la cámara del navegador (en iOS funciona también en la PWA instalada).
  - **App nativa (Expo) solo después de Fallas**, si la retención lo justifica y las notificaciones de iOS lo limitan de verdad.
- **Backend:** Supabase en una **región de la UE** (Postgres, PostGIS, autenticación, RLS, storage y funciones). Check-in, canje y entradas como funciones de Postgres o Edge Functions.
- **Mapas:** MapLibre con teselas de un proveedor (MapTiler, Stadia o Protomaps). Más barato y con menos dependencia que Mapbox o Google.
- **Pagos (entrega B):** Stripe Connect.
- **Notificaciones:** Web Push, más tarjeta al volver a abrir la app, más email con consentimiento.
- **Analítica:** SQL y vistas; PostHog si hace falta.

---

## 12. Planificación

| Cuándo | Qué | Decisión al final |
|---|---|---|
| **Del 10 de noviembre al 15 de diciembre** | **Fase 0 sin app.** Prelista con formulario y QR a un formulario con 3-5 locales. **Entrevistas con 10-15 fallas** (presidentes o responsables de festejos), que planifican y contratan orquestas meses antes. Entrevistas con 25-30 usuarios (universitarios locales y Erasmus) y 10-15 locales, preguntando por precio. Recopilar en una hoja de cálculo las verbenas de 2026 de los barrios elegidos y **medir el tiempo que cuesta** | **Seguir** si: check-in ≥ 30 %, clientes nuevos ≥ 50 %, al menos 3 locales con precio firmado y al menos un canal de captación (asociaciones Erasmus o universitarias) |
| **15 de diciembre** | **Nombre y dominio definitivos** (están en la ruta crítica: sin ellos no se imprimen QR) | — |
| **Del 15 de diciembre al 15 de enero** | Desarrollo del núcleo: modelo de datos, autenticación, check-in, canje con validación en el servidor y panel del local | — |
| **15 de enero** | **Decisión sobre la entrega B**: ¿hay alguna falla firmada para vender entradas? | Si no la hay, solo enlace externo y apuntarse sin pago |
| **Del 15 de enero al 15 de febrero** | Modo Fallas (mapa, calendario, fichas y admin de eventos), recomendación, valoración e inglés. Entrega B si procede | — |
| **Del 15 al 28 de febrero** | Pruebas con 20-30 usuarios y 3-5 locales. **Revisión de seguridad.** Carga del catálogo de Fallas de 2027. Captación en las welcome weeks | — |
| **Del 1 al 19 de marzo** | **Lanzamiento en Fallas** | — |
| **Del 20 de marzo a junio** | Producto de bares en noches flojas, ampliación al público de más de 30, empezar a cobrar a los locales que superen el umbral | **Medir la retención después de Fallas** |

**Orden de construcción:**
1. Modelo de datos, autenticación y RLS con tests.
2. Check-in, canje y QR fijo y de pantalla (el núcleo de lo que se cobra).
3. Panel del local.
4. Catálogo de eventos y admin (modo Fallas).
5. "Esta noche", mapa y recomendación.
6. Valoración, puntos e inglés.
7. Entrega B: entradas y modo puerta.

**Riesgo de plazo:** son unas 10 semanas con la Navidad en medio. Si hay que recortar, el orden de recorte es: entrega B, puntos, mapa a pantalla completa, inglés en el panel. **No se recortan** el canje, la validación en el servidor ni la RLS con tests.

---

## 13. Decisiones

### Cerradas en la v2
1. **PWA** para el MVP. Nativa, a valorar después de Fallas.
2. **Check-in sin prelista previa:** se permite y se marca como espontáneo.
3. **Ubicación:** radio de 150 m configurable. Sin permiso de ubicación se muestra la oferta, pero en el piloto no se cobra.
4. **Duración de la oferta:** válida toda la noche; 15 minutos desde que se pulsa "Canjear".
5. **Check-in mixto:** escanea siempre el usuario, el QR puede ser fijo o de pantalla, y **se cobra el canje**. No hay app nativa para locales.
6. **Edad:** filtro y criterio de recomendación en una sola app.
7. **Lanzamiento en Fallas** con la guía de verbenas y el producto de bares.

### Pendientes
1. **Dominio y registro de marca de «Hunter»** (antes del 15 de diciembre). Comprobar la OEPM y la EUIPO en las clases 9, 35, 41 y 43.
2. **Modelo de cobro al local:** precio por canje de cliente nuevo, precio para quien repite, tope mensual o cuota fija más canje. Se decide con los datos de las entrevistas.
3. **Comisión por entrada** de verbena y quién asume la comisión de Stripe.
4. **Umbrales:** muestra mínima (15-20), apuntados mínimos visibles (15) y canjes para empezar a cobrar.
5. **Franja de día (de 08:00 a 18:00):** ¿cuenta como "noche" para los actos falleros de día?
6. **Qué barrios y fallas** se cubren en el catálogo de Fallas de 2027.
7. **Quién mantiene el catálogo de Fallas** durante la campaña y con cuántas horas.

---

## 14. Riesgos principales

| Riesgo | Gravedad | Cómo abordarlo |
|---|---|---|
| Los usuarios de Fallas no vuelven después del 19 de marzo | Alta | Preferencias y cuenta desde el primer uso; producto de bares activo ya durante Fallas; medir la retención en abril |
| Los locales pagan por clientes que ya tenían | Alta | Cobrar solo canjes de primera visita |
| El catálogo de Fallas se queda desactualizado | Alta | Zona limitada, fuente y fecha de verificación, medir minutos por evento, las fallas editan sus propios eventos |
| No hay tiempo antes del 1 de marzo | Alta | Entrega B condicionada y orden de recorte definido |
| Pagos y devoluciones de entradas | Media-alta | Stripe Connect, la falla como organizadora, condiciones revisadas por un abogado |
| Fraude con el QR | Media | Se cobra el canje, QR de pantalla opcional, alertas |
| Normativa sobre alcohol | Media | Ofertas no solo de alcohol, aviso de salud, puntos que no dependen del consumo |
| Marca y dominio de "Hunter" sin comprobar | Media | Consultar la OEPM y la EUIPO y comprar dominios antes del 15 de diciembre |
| Seguridad del código generado con IA | Alta | Nivel N2: RLS con tests, funciones de servidor, revisión externa |

---

## 15. Glosario

- **Prelista:** apuntarse a un local o a un evento para esa noche.
- **Check-in:** el usuario escanea el QR del local al llegar. Es la presencia.
- **Canje:** el usuario desliza "Canjear" delante del camarero. **Es lo que se cobra.**
- **QR fijo:** QR impreso del local.
- **QR de pantalla:** QR que cambia cada 30 s en el modo pantalla del panel web del local.
- **Modo puerta:** página web con la que el personal de una falla escanea entradas.
- **Oferta:** lo que da el local por ir (preferiblemente no solo alcohol). Se desbloquea con el check-in y se usa con el canje.
- **Cliente nuevo:** usuario que canjea por primera vez en ese local.
- **Local fundador:** de los primeros locales; entra gratis y con el precio bloqueado.
- **Noche:** franja de 18:00 a 08:00, asignada a la fecha en que empieza (hora de Madrid).
- **Modo Fallas:** configuración que activa la guía de verbenas del 1 al 19 de marzo.
