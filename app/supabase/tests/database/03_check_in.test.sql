begin;
\ir helpers.psql
select plan(27);
select pg_temp.seed();

-- Atajo: check-in del usuario A en el bar de prueba con QR fijo.
create function pg_temp.check_in_a(p_token text, p_lat double precision, p_lng double precision, p_now timestamptz)
returns public.checkins language sql as $$
  select * from app.check_in_at('00000000-0000-0000-0000-00000000000a',
    '30000000-0000-0000-0000-000000000001', p_token, null, p_lat, p_lng, p_now)
$$;

-- Caso feliz
create temp table ok_checkin as
  select * from pg_temp.check_in_a('static-token-1', pg_temp.near_lat(), pg_temp.near_lng(), pg_temp.friday_night());
select is((select night_date from ok_checkin), '2026-11-13'::date, 'el check-in de la 01:30 cuenta para el viernes');
select ok((select geo_ok from ok_checkin), 'cerca del local: geo_ok');
select ok((select not flagged from ok_checkin), 'cerca del local: no marcado');
select is((select qr_kind from ok_checkin), 'static', 'tipo de QR fijo');
select cmp_ok((select distance_m from ok_checkin), '<', 150, 'distancia guardada en metros');
select is((select is_spontaneous from public.signups where id = (select signup_id from ok_checkin)), true,
  'sin prelista previa se crea una prelista espontánea');

select throws_ok($$ select pg_temp.check_in_a('static-token-1', null, null, pg_temp.friday_night() + interval '1 hour') $$,
  'P0001', 'already_checked_in', 'un solo check-in por usuario, local y noche');
select lives_ok($$ select pg_temp.check_in_a('static-token-1', null, null, '2026-11-14 21:00:00+00') $$,
  'la noche siguiente sí puede volver a hacer check-in');

-- Prelista previa
insert into public.signups (user_id, place_id, night_date, is_spontaneous)
values ('00000000-0000-0000-0000-00000000000b', '30000000-0000-0000-0000-000000000001', '2026-11-13', false);
select is(
  (select s.is_spontaneous from app.check_in_at('00000000-0000-0000-0000-00000000000b',
     '30000000-0000-0000-0000-000000000001', 'static-token-1', null, null, null, pg_temp.friday_night()) c
   join public.signups s on s.id = c.signup_id),
  false, 'si ya estaba en la prelista, se reutiliza');

-- Ubicación
select is((select geo_ok from public.checkins where user_id = '00000000-0000-0000-0000-00000000000b'), false,
  'sin ubicación: geo_ok falso');
select is((select flagged from public.checkins where user_id = '00000000-0000-0000-0000-00000000000b'), true,
  'sin ubicación: queda marcado');
delete from public.checkins; delete from public.signups;
select throws_ok($$ select pg_temp.check_in_a('static-token-1', pg_temp.far_lat(), pg_temp.near_lng(), pg_temp.friday_night()) $$,
  'P0001', 'too_far', 'a 1 km del local se rechaza');
select throws_ok($$ select pg_temp.check_in_a('static-token-1', pg_temp.near_lat(), null, pg_temp.friday_night()) $$,
  'P0001', 'invalid_location', 'ubicación incompleta se rechaza');
select throws_ok($$ select pg_temp.check_in_a('static-token-1', 95, 0, pg_temp.friday_night()) $$,
  'P0001', 'invalid_location', 'latitud fuera de rango se rechaza');

-- QR
select throws_ok($$ select pg_temp.check_in_a('token-falso', null, null, pg_temp.friday_night()) $$,
  'P0001', 'qr_invalid', 'token fijo incorrecto');
select throws_ok($$ select pg_temp.check_in_a('static-token-2', null, null, pg_temp.friday_night()) $$,
  'P0001', 'qr_invalid', 'token de otro local');
update app.place_qr set revoked_at = now() where place_id = '30000000-0000-0000-0000-000000000001';
select throws_ok($$ select pg_temp.check_in_a('static-token-1', null, null, pg_temp.friday_night()) $$,
  'P0001', 'qr_invalid', 'QR revocado');
update app.place_qr set revoked_at = null;

-- QR de pantalla: vale el paso actual y el anterior (30 s cada uno), no el de hace 60 s.
create function pg_temp.screen_check_in(p_steps_back int) returns public.checkins language sql as $$
  select * from app.check_in_at('00000000-0000-0000-0000-00000000000a',
    '30000000-0000-0000-0000-000000000001', null,
    app.screen_code(convert_to('secret-1', 'UTF8'),
      floor(extract(epoch from pg_temp.friday_night()) / 30)::bigint - p_steps_back),
    null, null, pg_temp.friday_night())
$$;
select throws_ok('select pg_temp.screen_check_in(2)', 'P0001', 'qr_invalid', 'código de pantalla caducado');
select throws_ok('select pg_temp.screen_check_in(-2)', 'P0001', 'qr_invalid',
  'código de pantalla de dentro de 60 s (reloj del local muy adelantado) no vale');
select is((select qr_kind from pg_temp.screen_check_in(1)), 'screen', 'código de pantalla del paso anterior es válido');
delete from public.checkins; delete from public.signups;
select is((select qr_kind from pg_temp.screen_check_in(-1)), 'screen',
  'código del paso siguiente es válido (tolera 30 s de reloj adelantado en el local)');

-- Local y usuario
select throws_ok($$ select app.check_in_at('00000000-0000-0000-0000-00000000000a',
  '30000000-0000-0000-0000-000000000002', 'static-token-2', null, null, null, pg_temp.friday_night()) $$,
  'P0001', 'place_unavailable', 'local inactivo');
select throws_ok($$ select app.check_in_at('00000000-0000-0000-0000-00000000000b',
  '30000000-0000-0000-0000-000000000001', 'static-token-1', null, null, null, '2026-11-13 12:00:00+00') $$,
  'P0001', 'place_closed', 'fuera del horario de apertura');
select throws_ok($$ select app.check_in_at('00000000-0000-0000-0000-00000000000c',
  '30000000-0000-0000-0000-000000000001', 'static-token-1', null, null, null, pg_temp.friday_night()) $$,
  'P0001', 'not_adult', 'un menor no puede hacer check-in');

-- Límite exacto: la noche del 13/11 a la 01:30 la fecha local ya es 14/11.
select pg_temp.create_user('00000000-0000-0000-0000-0000000000e1', 'cumple_hoy', '2008-11-14');
select pg_temp.create_user('00000000-0000-0000-0000-0000000000e2', 'cumple_manana', '2008-11-15');
select lives_ok($$ select app.check_in_at('00000000-0000-0000-0000-0000000000e1',
  '30000000-0000-0000-0000-000000000001', 'static-token-1', null, null, null, pg_temp.friday_night()) $$,
  'quien cumple 18 ese día ya puede hacer check-in');
select throws_ok($$ select app.check_in_at('00000000-0000-0000-0000-0000000000e2',
  '30000000-0000-0000-0000-000000000001', 'static-token-1', null, null, null, pg_temp.friday_night()) $$,
  'P0001', 'not_adult', 'a quien le falta un día para los 18 se le rechaza');

-- After: el check-in de las 08:30 del domingo cuenta para la noche del sábado.
insert into public.place_opening_hours (place_id, weekday, opens_at, closes_at)
values ('30000000-0000-0000-0000-000000000001', 6, '23:00', '09:00')
on conflict (place_id, weekday) do update set opens_at = excluded.opens_at, closes_at = excluded.closes_at;
select is((select night_date from app.check_in_at('00000000-0000-0000-0000-00000000000d',
  '30000000-0000-0000-0000-000000000001', 'static-token-1', null, null, null, '2026-11-15 07:30:00+00')),
  '2026-11-14'::date, 'after: check-in a las 08:30 del domingo cuenta para el sábado');

select * from finish();
rollback;
