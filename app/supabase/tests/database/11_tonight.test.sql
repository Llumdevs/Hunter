begin;
\ir helpers.psql
select plan(24);
select pg_temp.seed();

-- ---------------------------------------------------------------- Gustos
select pg_temp.login_as('00000000-0000-0000-0000-00000000000a');
select lives_ok($$ insert into public.user_preferences (user_id, music, vibe, price, age_bands)
  values ('00000000-0000-0000-0000-00000000000a', '{house,techno}', '{bailar}', '{€€}', '{25-30}') $$,
  'el usuario guarda sus gustos');
select throws_ok($$ update public.user_preferences set music = '{polka}' $$, '23514', null, 'solo músicas del catálogo');
select throws_ok($$ insert into public.user_preferences (user_id, music) values ('00000000-0000-0000-0000-00000000000b', '{pop}') $$,
  '42501', null, 'nadie guarda gustos de otro');
reset role;
select pg_temp.login_as('00000000-0000-0000-0000-00000000000b');
select is((select count(*)::int from public.user_preferences), 0, 'nadie ve los gustos de otro');
reset role;

-- ---------------------------------------------------------------- Programación y precio
select pg_temp.login_as('00000000-0000-0000-0000-00000000000d');
select lives_ok($$ insert into public.place_programming (place_id, weekday, music, vibe)
  values ('30000000-0000-0000-0000-000000000001', 5, 'house', 'bailar') $$,
  'el personal define la programación del viernes');
select lives_ok($$ update public.places set price_level = '€€' where id = '30000000-0000-0000-0000-000000000001' $$,
  'el personal define el precio');
reset role;
select pg_temp.login_as('00000000-0000-0000-0000-00000000000a');
select throws_ok($$ insert into public.place_programming (place_id, weekday, music, vibe)
  values ('30000000-0000-0000-0000-000000000001', 6, 'pop', 'hablar') $$,
  '42501', null, 'quien no es del local no toca su programación');
reset role;

-- ---------------------------------------------------------------- Esta noche
create temp table tonight as select * from app.tonight_places_at(pg_temp.friday_night());
select is((select count(*)::int from tonight where id in ('30000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002')), 1,
  'solo locales activos y abiertos esta noche');
select results_eq($$ select music, vibe, price_level from tonight where id = '30000000-0000-0000-0000-000000000001' $$,
  $$ values ('house'::text, 'bailar'::text, '€€'::text) $$, 'programación de esta noche y precio');
select is((select signups_visible from tonight where id = '30000000-0000-0000-0000-000000000001'), null::int,
  'con menos de 15 apuntados no se muestra la cifra');
select is((select age_source from tonight where id = '30000000-0000-0000-0000-000000000001'), 'venue',
  'sin muestra suficiente, la edad es la que declara el local');

-- 15 apuntados y 15 check-ins de gente de 25-30 años en las últimas semanas
select pg_temp.create_user(('00000000-0000-0000-0001-' || lpad(i::text, 12, '0'))::uuid, 'u' || i, '1999-05-05')
from generate_series(1, 15) i;
insert into public.signups (user_id, place_id, night_date, is_spontaneous)
select ('00000000-0000-0000-0001-' || lpad(i::text, 12, '0'))::uuid, '30000000-0000-0000-0000-000000000001', '2026-11-13', false
from generate_series(1, 15) i;
insert into public.checkins (user_id, place_id, night_date, created_at, qr_kind, geo_ok)
select ('00000000-0000-0000-0001-' || lpad(i::text, 12, '0'))::uuid, '30000000-0000-0000-0000-000000000001',
       date '2026-11-06' - i, pg_temp.friday_night() - make_interval(days => 7 + i), 'static', true
from generate_series(1, 15) i;
drop table tonight;
create temp table tonight as select * from app.tonight_places_at(pg_temp.friday_night());
select is((select signups_visible from tonight where id = '30000000-0000-0000-0000-000000000001'), 15,
  'a partir de 15 apuntados se muestra la cifra');
select results_eq($$ select age_band, age_source from tonight where id = '30000000-0000-0000-0000-000000000001' $$,
  $$ values ('25-30'::text, 'checkins'::text) $$, 'con 15 check-ins la edad sale de quien va de verdad');
select is((select signups_any from tonight where id = '30000000-0000-0000-0000-000000000001'), true,
  'se indica si hay apuntados aunque no se muestre la cifra');

-- ---------------------------------------------------------------- Prelista
select is((app.sign_up_at('00000000-0000-0000-0000-00000000000b', '30000000-0000-0000-0000-000000000001', pg_temp.friday_night()))->>'ok',
  'true', 'apuntarse a la prelista de esta noche');
select is((select night_date from public.signups where user_id = '00000000-0000-0000-0000-00000000000b'), '2026-11-13'::date,
  'la prelista es para la noche en curso');
select is(app.sign_up_at('00000000-0000-0000-0000-00000000000b', '30000000-0000-0000-0000-000000000001', pg_temp.friday_night()),
  '{"ok": true, "already": true}'::jsonb, 'apuntarse dos veces no duplica');
select is(app.sign_up_at('00000000-0000-0000-0000-00000000000b', '30000000-0000-0000-0000-000000000002', pg_temp.friday_night()),
  '{"ok": false, "error": "place_unavailable"}'::jsonb, 'no se puede apuntar a un local inactivo');
select is(app.cancel_signup_at('00000000-0000-0000-0000-00000000000b', '30000000-0000-0000-0000-000000000001', pg_temp.friday_night()),
  '{"ok": true}'::jsonb, 'cancelar la prelista');
select isnt((select cancelled_at from public.signups where user_id = '00000000-0000-0000-0000-00000000000b'), null::timestamptz,
  'queda marcada como cancelada');
select is((app.sign_up_at('00000000-0000-0000-0000-00000000000b', '30000000-0000-0000-0000-000000000001', pg_temp.friday_night()))->>'ok',
  'true', 'volver a apuntarse tras cancelar');

-- ---------------------------------------------------------------- Ajustes de recomendación
select pg_temp.login_anon();
select is((select public.recommendation_settings()),
  '{"weight_music": 2, "weight_vibe": 2, "weight_age": 2, "weight_price": 1, "match_threshold": 0.6}'::jsonb,
  'los pesos se leen de la configuración');
reset role;

-- ---------------------------------------------------------------- Borrar la cuenta
select pg_temp.login_as('00000000-0000-0000-0000-00000000000b');
select lives_ok('select public.delete_my_account()', 'el usuario borra su cuenta');
reset role;
select is((select count(*)::int from public.signups where user_id = '00000000-0000-0000-0000-00000000000b')
        + (select count(*)::int from public.profiles where id = '00000000-0000-0000-0000-00000000000b')
        + (select count(*)::int from auth.users where id = '00000000-0000-0000-0000-00000000000b'), 0,
  'no queda nada del usuario borrado');

select * from finish();
rollback;
