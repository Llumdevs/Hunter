begin;
\ir helpers.psql
select plan(37);
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
select is(public.request_friend(current_setting('test.friend_a'))->>'error', 'invalid_friend_code', 'no puede añadirse a sí mismo');
select is(public.request_friend(current_setting('test.friend_b'))->>'ok', 'true', 'solicitud por código');
select is(jsonb_array_length(public.my_friends()), 1, 'el remitente ve su solicitud');
select is(public.respond_friend((public.my_friends()->0->>'id')::uuid, true)->>'error', 'request_not_found', 'el remitente no acepta su propia solicitud');
select is((public.my_friends()->0) ? 'email', false, 'no se publica el correo del amigo');
select set_config('test.request_id', public.my_friends()->0->>'id', true);
reset role;
select pg_temp.login_as('00000000-0000-0000-0000-00000000000c');
select is(jsonb_array_length(public.my_friends()), 0, 'un tercero no ve la relación');
select is((select count(*)::int from public.friend_requests), 0, 'RLS esconde las solicitudes de otros');
select is((select count(*)::int from public.pilot_feedback), 0, 'RLS esconde el feedback de otros');
select is(public.respond_friend(current_setting('test.request_id')::uuid, true)->>'error', 'request_not_found', 'un tercero no acepta una solicitud conocida');
select is(public.respond_friend(current_setting('test.request_id')::uuid, false)->>'error', 'request_not_found', 'un tercero no elimina una relación conocida');
reset role;
select pg_temp.login_as('00000000-0000-0000-0000-00000000000b');
select is(public.respond_friend((public.my_friends()->0->>'id')::uuid, true)->>'ok', 'true', 'el destinatario acepta');
select is(public.my_friends()->0->>'status', 'accepted', 'la relación queda aceptada');
select is(public.request_friend(current_setting('test.friend_a'))->>'error', 'already_requested', 'no hay duplicados en sentido contrario');
reset role;

insert into public.checkins(id, user_id, place_id, night_date, qr_kind, geo_ok, created_at)
values ('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-000000000001', current_date - 1, 'static', true, now() - interval '1 day'),
       ('50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000b', '30000000-0000-0000-0000-000000000001', current_date - 1, 'static', true, now() - interval '1 day');
select pg_temp.login_as('00000000-0000-0000-0000-00000000000a');
select is((public.my_pilot_profile()->>'points')::int, 10, 'un check-in verificado suma 10');
select is(public.review_visit('50000000-0000-0000-0000-000000000002', 5)->>'error', 'verified_visit_required', 'no se valora la visita de otro');
select is(public.review_visit('50000000-0000-0000-0000-000000000001', 6)->>'error', 'invalid_review', 'solo de 1 a 5 estrellas');
select is(public.review_visit('50000000-0000-0000-0000-000000000001', 4, 'Buena música')->>'ok', 'true', 'se valora una visita propia');
select is(public.review_visit('50000000-0000-0000-0000-000000000001', 5)->>'error', 'already_reviewed', 'no se duplican valoraciones ni puntos');
select is((public.my_pilot_profile()->>'points')::int, 15, 'la valoración suma 5 una sola vez');
select is((public.my_reviewable_visits()->0->>'rating')::int, 4, 'la visita muestra su valoración');
select is(public.place_rating_summary('30000000-0000-0000-0000-000000000001')->>'average', null::text, 'con menos de 3 valoraciones no se publica media');
select throws_ok($$ insert into public.place_reviews(checkin_id, place_id, rating) values ('50000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 5) $$, '42501', null, 'no se insertan valoraciones por fuera de la función');
select is(public.respond_friend((public.my_friends()->0->>'id')::uuid, false)->>'ok', 'true', 'cualquiera de los dos puede eliminar la amistad');
reset role;
insert into app.rate_limit_events(user_id, action, created_at)
select '00000000-0000-0000-0000-00000000000a', 'friend_request', now() from generate_series(1, 20);
select pg_temp.login_as('00000000-0000-0000-0000-00000000000a');
select is(public.request_friend(current_setting('test.friend_b'))->>'error', 'rate_limited', 'cancelar una solicitud no borra los intentos del día');
reset role;
update public.checkins set flagged = true where id = '50000000-0000-0000-0000-000000000002';
select pg_temp.login_as('00000000-0000-0000-0000-00000000000b');
select is(public.review_visit('50000000-0000-0000-0000-000000000002', 4)->>'error', 'verified_visit_required', 'una visita marcada no permite valorar');
select * from finish();
rollback;
