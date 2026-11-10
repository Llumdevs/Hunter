begin;
\ir helpers.psql
select plan(3);
select pg_temp.seed();

select throws_ok($$ insert into public.offers (place_id, title, includes_alcohol, days_of_week)
  values ('30000000-0000-0000-0000-000000000001', 'Sin días', false, '{}') $$,
  '23514', null, 'una oferta necesita al menos un día');
select throws_ok($$ insert into public.offers (place_id, title, includes_alcohol, days_of_week)
  values ('30000000-0000-0000-0000-000000000001', '  ', false, '{1}') $$,
  '23514', null, 'el título no puede estar vacío');
select throws_ok($$ insert into public.offers (place_id, title, description, includes_alcohol, days_of_week)
  values ('30000000-0000-0000-0000-000000000001', 'Ok', repeat('a', 201), false, '{1}') $$,
  '23514', null, 'la descripción tiene como máximo 200 caracteres');

select * from finish();
rollback;
