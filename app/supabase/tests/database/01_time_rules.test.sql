begin;
\ir helpers.psql
select plan(19);

-- night_date: la noche va de 18:00 a 08:00 y se asigna a la fecha en que empieza.
select is(app.night_date('2026-11-14 00:30:00+00', 'Europe/Madrid'), '2026-11-13'::date,
  '01:30 del sábado pertenece a la noche del viernes');
select is(app.night_date('2026-11-13 19:00:00+00', 'Europe/Madrid'), '2026-11-13'::date,
  '20:00 del viernes pertenece a la noche del viernes');
select is(app.night_date('2026-11-14 06:59:00+00', 'Europe/Madrid'), '2026-11-13'::date,
  '07:59 sigue siendo la noche anterior');
select is(app.night_date('2026-11-14 07:00:00+00', 'Europe/Madrid'), '2026-11-14'::date,
  '08:00 ya es el día siguiente');
select is(app.night_date('2027-03-28 01:30:00+00', 'Europe/Madrid'), '2027-03-27'::date,
  'cambio a horario de verano: 03:30 CEST sigue en la noche del sábado');

-- opening_session: fecha en que empezó la apertura que contiene esa hora local (null si cerrado).
select is(app.opening_session('30000000-0000-0000-0000-000000000001', '2026-11-13 20:00'), null::date,
  'sin horario (aún no hay seed) está cerrado');
select pg_temp.seed();
select is(app.opening_session('30000000-0000-0000-0000-000000000001', '2026-11-13 20:00'), '2026-11-13'::date,
  'abre a las 20:00 del viernes');
select is(app.opening_session('30000000-0000-0000-0000-000000000001', '2026-11-13 19:59'), null::date,
  'cerrado a las 19:59');
select is(app.opening_session('30000000-0000-0000-0000-000000000001', '2026-11-14 02:59'), '2026-11-13'::date,
  'a las 02:59 del sábado sigue la sesión del viernes');
select is(app.opening_session('30000000-0000-0000-0000-000000000001', '2026-11-14 03:00'), null::date,
  'cerrado a las 03:00');

-- After que abre el sábado de 23:00 a 09:00 y local de tardeo el viernes de 12:00 a 18:00.
insert into public.places (id, city_id, organizer_id, kind, slug, name, zone, address, location, is_active)
values ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001',
        '20000000-0000-0000-0000-000000000001', 'club', 'after', 'After', 'Ruzafa', 'Calle 3',
        extensions.st_makepoint(-0.3730, 39.4620)::extensions.geography, true),
       ('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001',
        '20000000-0000-0000-0000-000000000001', 'bar', 'tardeo', 'Tardeo', 'Ruzafa', 'Calle 4',
        extensions.st_makepoint(-0.3730, 39.4620)::extensions.geography, true);
insert into public.place_opening_hours (place_id, weekday, opens_at, closes_at)
values ('30000000-0000-0000-0000-000000000003', 6, '23:00', '09:00'),
       ('30000000-0000-0000-0000-000000000004', 5, '12:00', '18:00');
select is(app.opening_session('30000000-0000-0000-0000-000000000003', '2026-11-15 08:30'), '2026-11-14'::date,
  'after: a las 08:30 del domingo sigue la sesión del sábado');
select is(app.opening_session('30000000-0000-0000-0000-000000000003', '2026-11-15 09:00'), null::date,
  'after: cerrado a las 09:00');
select is(app.opening_session('30000000-0000-0000-0000-000000000004', '2026-11-13 13:00'), '2026-11-13'::date,
  'tardeo: a las 13:00 del viernes está abierto');
update public.place_opening_hours set closes_at = '02:00' where place_id = '30000000-0000-0000-0000-000000000004';
select is(app.opening_session('30000000-0000-0000-0000-000000000004', '2026-11-14 01:00'), '2026-11-13'::date,
  'de 12:00 a 02:00: a la 01:00 del sábado sigue la sesión del viernes');

-- offer_deadline: la hora límite de la oferta se sitúa dentro de la sesión.
select is(app.offer_deadline('30000000-0000-0000-0000-000000000001', '2026-11-13', '01:00'),
  '2026-11-14 01:00'::timestamp, 'límite 01:00 en una sesión que abre a las 20:00 es la madrugada siguiente');
select is(app.offer_deadline('30000000-0000-0000-0000-000000000001', '2026-11-13', '23:00'),
  '2026-11-13 23:00'::timestamp, 'límite 23:00 es el mismo día');

-- Código del QR de pantalla: vector de referencia calculado con Python (HMAC-SHA256, 8 hex).
select is(app.screen_code(convert_to('secret-1', 'UTF8'), 59012345), '43dd8124', 'vector de referencia 1');
select is(app.screen_code(convert_to('secret-1', 'UTF8'), 0), 'da70af9b', 'vector de referencia 2');
select is(app.screen_code(convert_to('secret-1', 'UTF8'), 14), '93600592', 'vector de referencia 3 (byte 0x05)');

select * from finish();
rollback;
