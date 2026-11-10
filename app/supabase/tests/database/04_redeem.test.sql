begin;
\ir helpers.psql
select plan(15);
select pg_temp.seed();

create function pg_temp.check_in(p_user uuid, p_lat double precision, p_lng double precision, p_now timestamptz)
returns uuid language sql as $$
  select id from app.check_in_at(p_user, '30000000-0000-0000-0000-000000000001',
    'static-token-1', null, p_lat, p_lng, p_now)
$$;

create function pg_temp.redeem(p_user uuid, p_checkin uuid, p_now timestamptz)
returns public.redemptions language sql as $$
  select * from app.redeem_at(p_user, p_checkin, '40000000-0000-0000-0000-000000000001', p_now)
$$;

-- Caso feliz: primera visita con ubicación correcta → se cobra.
create temp table first_ck as
  select pg_temp.check_in('00000000-0000-0000-0000-00000000000a', pg_temp.near_lat(), pg_temp.near_lng(),
                          pg_temp.friday_night()) as id;
create temp table first_rd as
  select * from pg_temp.redeem('00000000-0000-0000-0000-00000000000a', (select id from first_ck),
                               pg_temp.friday_night() + interval '10 minutes');
select ok((select is_first_visit from first_rd), 'primera visita');
select ok((select billable from first_rd), 'primera visita con ubicación: se cobra');
select is((select expires_at from first_rd), pg_temp.friday_night() + interval '25 minutes',
  'el canje caduca 15 minutos después de pulsar Canjear');
select is((select offer_snapshot->>'title' from first_rd), 'Tapa gratis', 'se guarda la oferta tal como era');

select throws_ok($$ select pg_temp.redeem('00000000-0000-0000-0000-00000000000a', (select id from first_ck), pg_temp.friday_night()) $$,
  'P0001', 'already_redeemed', 'un solo canje por check-in');
select throws_ok($$ select pg_temp.redeem('00000000-0000-0000-0000-00000000000b', (select id from first_ck), pg_temp.friday_night()) $$,
  'P0001', 'checkin_not_found', 'no se puede canjear el check-in de otro usuario');

-- Segunda visita otra noche → no es cliente nuevo → no se cobra.
create temp table second_ck as
  select pg_temp.check_in('00000000-0000-0000-0000-00000000000a', pg_temp.near_lat(), pg_temp.near_lng(),
                          '2026-11-14 21:00:00+00') as id;
create temp table second_rd as
  select * from pg_temp.redeem('00000000-0000-0000-0000-00000000000a', (select id from second_ck), '2026-11-14 21:05:00+00');
select ok(not (select is_first_visit from second_rd), 'segunda visita no es primera visita');
select ok(not (select billable from second_rd), 'cliente que repite: no se cobra');

-- Sin ubicación → no se cobra en el piloto.
create temp table nogeo_ck as
  select pg_temp.check_in('00000000-0000-0000-0000-00000000000b', null, null, pg_temp.friday_night()) as id;
create temp table nogeo_rd as
  select * from pg_temp.redeem('00000000-0000-0000-0000-00000000000b', (select id from nogeo_ck), pg_temp.friday_night());
select ok((select is_first_visit from nogeo_rd), 'la primera visita es por usuario: B es nuevo aunque A ya canjeó');
select ok(not (select billable from nogeo_rd), 'sin ubicación: no se cobra');

-- El check-in de una noche no se puede canjear en otra.
create temp table old_ck as
  select pg_temp.check_in('00000000-0000-0000-0000-00000000000d', null, null, pg_temp.friday_night()) as id;
select throws_ok($$ select pg_temp.redeem('00000000-0000-0000-0000-00000000000d', (select id from old_ck), '2026-11-14 21:00:00+00') $$,
  'P0001', 'checkin_expired', 'check-in de otra noche');

-- Disponibilidad de la oferta
update public.offers set valid_until_time = '01:00';
select throws_ok($$ select pg_temp.redeem('00000000-0000-0000-0000-00000000000d', (select id from old_ck), pg_temp.friday_night()) $$,
  'P0001', 'offer_expired', 'pasada la hora límite de la oferta');
update public.offers set valid_until_time = null, days_of_week = '{1,2,3,4}';
select throws_ok($$ select pg_temp.redeem('00000000-0000-0000-0000-00000000000d', (select id from old_ck), pg_temp.friday_night()) $$,
  'P0001', 'offer_unavailable', 'la oferta no está activa los viernes');
update public.offers set days_of_week = '{1,2,3,4,5,6,7}', is_active = false;
select throws_ok($$ select pg_temp.redeem('00000000-0000-0000-0000-00000000000d', (select id from old_ck), pg_temp.friday_night()) $$,
  'P0001', 'offer_unavailable', 'oferta pausada');

-- Funciones públicas: usan el usuario de la sesión.
update public.offers set is_active = true;
delete from public.redemptions; delete from public.checkins; delete from public.signups;
select pg_temp.login_as('00000000-0000-0000-0000-00000000000c');
select is(public.check_in('30000000-0000-0000-0000-000000000001', 'static-token-1', null, null, null)->>'error',
  'not_adult', 'check_in público usa el usuario de la sesión (el menor es rechazado)');
reset role;

select * from finish();
rollback;
