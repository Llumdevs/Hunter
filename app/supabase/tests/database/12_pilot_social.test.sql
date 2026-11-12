begin;
\ir helpers.psql
select plan(28);
select pg_temp.seed();
select set_config('test.friend_a', (select friend_code from public.profiles where id = '00000000-0000-0000-0000-00000000000a'), true);
select set_config('test.friend_b', (select friend_code from public.profiles where id = '00000000-0000-0000-0000-00000000000b'), true);

select pg_temp.login_anon();
select throws_ok('select public.my_pilot_profile()', '42501', null, 'sin sesión no hay perfil');
select throws_ok($$ select public.request_friend('1234567890123456') $$, '42501', null, 'sin sesión no se envían solicitudes');
reset role;
select pg_temp.login_as('00000000-0000-0000-0000-00000000000a');
select is(public.my_pilot_profile()->>'name', 'adult_a', 'el resumen es del usuario de la sesión');
select is((public.my_pilot_profile()->>'points')::int, 0, 'sin actividad no hay puntos');
select is(public.update_my_city(' Valencia ')->>'ok', 'true', 'se guarda la procedencia');
select is(public.my_pilot_profile()->>'home_city', 'Valencia', 'la procedencia se recorta');
select is(public.update_my_city(repeat('a', 81))->>'error', 'invalid_city', 'se limita la procedencia');
select is(public.send_pilot_feedback('corto')->>'error', 'invalid_feedback', 'no se admiten mensajes demasiado cortos');
select is(public.send_pilot_feedback('Quiero poder compartir mis planes.')->>'ok', 'true', 'se guarda feedback');
select is((select count(*)::int from public.pilot_feedback), 1, 'el usuario ve su feedback');
select throws_ok($$ insert into public.pilot_feedback(message) values ('No se puede saltar la API') $$, '42501', null, 'no se salta la función de feedback');
do $$ begin for i in 1..4 loop perform public.send_pilot_feedback('Otro comentario de prueba útil.'); end loop; end $$;
select is(public.send_pilot_feedback('Un sexto comentario de prueba.')->>'error', 'rate_limited', 'máximo 5 mensajes de feedback al día');
-- La funcionalidad social se ha retirado; tampoco queda accesible por API.
select throws_ok('select public.my_friends()', '42501', null, 'la lectura de amigos está retirada');
select throws_ok($$ select public.request_friend('0123456789abcdef') $$, '42501', null, 'no se crean nuevas amistades');
select throws_ok($$ select public.respond_friend(gen_random_uuid(), true) $$, '42501', null, 'no se responden solicitudes antiguas');
select throws_ok('select * from public.friend_requests', '42501', null, 'el archivo social no se expone');
reset role;
select pg_temp.login_as('00000000-0000-0000-0000-00000000000c');
select is((select count(*)::int from public.pilot_feedback), 0, 'el feedback sigue siendo privado');
reset role;

insert into public.checkins(id, user_id, place_id, night_date, qr_kind, geo_ok, created_at)
values ('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-000000000001', current_date - 1, 'static', true, now() - interval '1 day'),
       ('50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000b', '30000000-0000-0000-0000-000000000001', current_date - 1, 'static', true, now() - interval '1 day');
select pg_temp.login_as('00000000-0000-0000-0000-00000000000a');
select is((public.my_pilot_profile()->>'points')::int, 0, 'el check-in no suma puntos de compras');
select is(public.review_visit('50000000-0000-0000-0000-000000000002', 5)->>'error', 'verified_visit_required', 'no se valora la visita de otro');
select is(public.review_visit('50000000-0000-0000-0000-000000000001', 6)->>'error', 'invalid_review', 'solo de 1 a 5 estrellas');
select is(public.review_visit('50000000-0000-0000-0000-000000000001', 4, 'Buena música')->>'ok', 'true', 'se valora una visita propia');
select is(public.review_visit('50000000-0000-0000-0000-000000000001', 5)->>'error', 'already_reviewed', 'no se duplican valoraciones ni puntos');
select is((public.my_pilot_profile()->>'points')::int, 0, 'las valoraciones no suman puntos de compras');
select is((public.my_pilot_profile()->>'legacy_points')::int, 0, 'las visitas nuevas tampoco incrementan el histórico congelado');
select is((public.my_reviewable_visits()->0->>'rating')::int, 4, 'la visita muestra su valoración');
select is(public.place_rating_summary('30000000-0000-0000-0000-000000000001')->>'average', null::text, 'con menos de 3 valoraciones no se publica media');
select throws_ok($$ insert into public.place_reviews(checkin_id, place_id, rating) values ('50000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 5) $$, '42501', null, 'no se insertan valoraciones por fuera de la función');
reset role;
update public.checkins set flagged = true where id = '50000000-0000-0000-0000-000000000002';
select pg_temp.login_as('00000000-0000-0000-0000-00000000000b');
select is(public.review_visit('50000000-0000-0000-0000-000000000002', 4)->>'error', 'verified_visit_required', 'una visita marcada no permite valorar');
select * from finish();
rollback;
