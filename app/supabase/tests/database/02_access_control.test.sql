begin;
\ir helpers.psql
select plan(17);
select pg_temp.seed();

insert into public.checkins (id, user_id, place_id, signup_id, night_date, qr_kind, geo_ok)
select '50000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a',
       '30000000-0000-0000-0000-000000000001', null, '2026-11-06', 'static', true;
insert into public.checkins (id, user_id, place_id, signup_id, night_date, qr_kind, geo_ok)
select '50000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000b',
       '30000000-0000-0000-0000-000000000001', null, '2026-11-06', 'static', true;

select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity),
  0, 'todas las tablas de public tienen RLS activado');

-- Visitante anónimo
select pg_temp.login_anon();
select is((select count(*)::int from public.places where city_id = '10000000-0000-0000-0000-000000000001'), 1,
  'anónimo ve solo los locales activos');
select is((select count(*)::int from public.offers o join public.places p on p.id = o.place_id
  where p.city_id = '10000000-0000-0000-0000-000000000001'), 1, 'anónimo ve las ofertas de locales activos');
select throws_ok('select * from public.checkins', '42501', null, 'anónimo no puede leer check-ins');
select throws_ok($$ select public.check_in('30000000-0000-0000-0000-000000000001', 'static-token-1', null, null, null) $$,
  '42501', null, 'anónimo no puede hacer check-in');
select throws_ok('select * from app.place_qr', '42501', null, 'anónimo no accede a los secretos del QR');
reset role;

-- Usuario A
select pg_temp.login_as('00000000-0000-0000-0000-00000000000a');
select is((select count(*)::int from public.checkins), 1, 'A ve solo su check-in');
select is((select count(*)::int from public.profiles), 1, 'A ve solo su perfil');
select throws_ok($$ insert into public.checkins (user_id, place_id, night_date, qr_kind, geo_ok)
  values ('00000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-000000000001', '2026-11-07', 'static', true) $$,
  '42501', null, 'A no puede insertar check-ins directamente');
select throws_ok($$ update public.redemptions set billable = false $$,
  '42501', null, 'A no puede modificar canjes');
select throws_ok('select * from app.place_qr', '42501', null, 'A no accede a los secretos del QR');
select throws_ok('select * from app.config', '42501', null, 'A no accede a la configuración');
with u as (update public.places set name = 'Hackeado' returning 1)
select is((select count(*)::int from u), 0, 'A no puede editar un local que no es suyo');
reset role;

-- Personal del local S
select pg_temp.login_as('00000000-0000-0000-0000-00000000000d');
select is((select count(*)::int from public.checkins), 0, 'el personal del local no ve check-ins individuales');
select is((select count(*)::int from public.places where organizer_id = '20000000-0000-0000-0000-000000000001'), 2,
  'el personal ve también sus locales inactivos');
with u as (update public.places set name = 'Bar Prueba 2'
           where id = '30000000-0000-0000-0000-000000000001' returning 1)
select is((select count(*)::int from u), 1, 'el personal puede editar su local');
select throws_ok($$ update public.places set is_founder = true where id = '30000000-0000-0000-0000-000000000001' $$,
  '42501', null, 'el personal no puede marcarse como local fundador');
reset role;

select * from finish();
rollback;
