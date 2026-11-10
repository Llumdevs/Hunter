begin;
\ir helpers.psql
select plan(15);
select pg_temp.seed();

-- Actividad del viernes 13: A con ubicación canjea (se cobra), B sin ubicación canjea (no se cobra),
-- M solo se apunta. El jueves 12 no hay nada.
select app.redeem_at('00000000-0000-0000-0000-00000000000a',
  (app.check_in_at('00000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-000000000001',
     'static-token-1', null, pg_temp.near_lat(), pg_temp.near_lng(), pg_temp.friday_night())).id,
  '40000000-0000-0000-0000-000000000001', pg_temp.friday_night());
select app.redeem_at('00000000-0000-0000-0000-00000000000b',
  (app.check_in_at('00000000-0000-0000-0000-00000000000b', '30000000-0000-0000-0000-000000000001',
     'static-token-1', null, null, null, pg_temp.friday_night())).id,
  '40000000-0000-0000-0000-000000000001', pg_temp.friday_night());
insert into public.signups (user_id, place_id, night_date, is_spontaneous)
values ('00000000-0000-0000-0000-00000000000c', '30000000-0000-0000-0000-000000000001', '2026-11-13', false);
-- Una prelista cancelada no cuenta como apuntado.
insert into public.signups (user_id, place_id, night_date, is_spontaneous, cancelled_at)
values ('00000000-0000-0000-0000-00000000000d', '30000000-0000-0000-0000-000000000001', '2026-11-13', false, now());

-- Personal del local
select pg_temp.login_as('00000000-0000-0000-0000-00000000000d');
create temp table stats as
  select * from public.place_nightly_stats('30000000-0000-0000-0000-000000000001', '2026-11-12', '2026-11-13');
select is((select count(*)::int from stats), 2, 'una fila por noche del rango, también sin actividad');
select is((select signups from stats where night_date = '2026-11-13'), 3, 'apuntados de la noche');
select is((select checkins from stats where night_date = '2026-11-13'), 2, 'check-ins de la noche');
select is((select redemptions from stats where night_date = '2026-11-13'), 2, 'canjes de la noche');
select is((select billable from stats where night_date = '2026-11-13'), 1, 'solo se cobraría el canje con ubicación');
select is((select signups + checkins + redemptions + billable from stats where night_date = '2026-11-12'), 0,
  'noche sin actividad a cero');
select throws_ok($$ select * from public.place_nightly_stats('30000000-0000-0000-0000-000000000001', '2026-11-13', '2026-11-12') $$,
  'P0001', 'invalid_range', 'rango invertido');
select throws_ok($$ select * from public.place_nightly_stats('30000000-0000-0000-0000-000000000001', '2026-01-01', '2026-11-13') $$,
  'P0001', 'range_too_large', 'como máximo 62 noches');
select is((select count(*)::int from public.place_nightly_stats('30000000-0000-0000-0000-000000000001', '2026-09-13', '2026-11-13')), 62,
  'exactamente 62 noches se permiten');
select throws_ok($$ select * from public.place_nightly_stats('30000000-0000-0000-0000-000000000001', '2026-09-12', '2026-11-13') $$,
  'P0001', 'range_too_large', '63 noches ya no');
select results_eq($$ select static_token, screen_secret from public.place_qr_credentials('30000000-0000-0000-0000-000000000001') $$,
  $$ values ('static-token-1'::text, encode(convert_to('secret-1', 'UTF8'), 'hex')) $$,
  'el personal obtiene el token fijo y el secreto de pantalla en hex');
reset role;

-- Usuario que no es del local y visitante anónimo
select pg_temp.login_as('00000000-0000-0000-0000-00000000000a');
select throws_ok($$ select * from public.place_nightly_stats('30000000-0000-0000-0000-000000000001', '2026-11-12', '2026-11-13') $$,
  '42501', 'forbidden', 'quien no es del local no ve sus cifras');
select throws_ok($$ select * from public.place_qr_credentials('30000000-0000-0000-0000-000000000001') $$,
  '42501', 'forbidden', 'quien no es del local no obtiene su QR');
reset role;
select pg_temp.login_anon();
select throws_ok($$ select * from public.place_qr_credentials('30000000-0000-0000-0000-000000000001') $$,
  '42501', null, 'anónimo no puede pedir credenciales');
reset role;

-- QR revocado
update app.place_qr set revoked_at = now() where place_id = '30000000-0000-0000-0000-000000000001';
select pg_temp.login_as('00000000-0000-0000-0000-00000000000d');
select throws_ok($$ select * from public.place_qr_credentials('30000000-0000-0000-0000-000000000001') $$,
  'P0001', 'qr_revoked', 'un QR revocado no se entrega');
reset role;

select * from finish();
rollback;
