begin;
\ir helpers.psql
select plan(9);
select pg_temp.seed();

-- Un check-in de hace 70 días y otro de hace 10, ambos con ubicación.
insert into public.checkins (id, user_id, place_id, night_date, created_at, qr_kind, lat, lng, distance_m, geo_ok)
values
  ('60000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a',
   '30000000-0000-0000-0000-000000000001', '2026-09-04', pg_temp.friday_night() - interval '70 days',
   'static', 39.46215, -0.37310, 20, true),
  ('60000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000a',
   '30000000-0000-0000-0000-000000000001', '2026-11-03', pg_temp.friday_night() - interval '10 days',
   'static', 39.46215, -0.37310, 20, true);

select is(app.purge_checkin_locations(pg_temp.friday_night()), 1, 'se purga un check-in');
select is((select lat from public.checkins where id = '60000000-0000-0000-0000-000000000001'), null::double precision,
  'el antiguo pierde la latitud');
select is((select lng from public.checkins where id = '60000000-0000-0000-0000-000000000001'), null::double precision,
  'el antiguo pierde la longitud');
select is((select distance_m from public.checkins where id = '60000000-0000-0000-0000-000000000001'), 20,
  'la distancia se conserva como prueba del cobro');
select ok((select geo_ok from public.checkins where id = '60000000-0000-0000-0000-000000000001'),
  'geo_ok se conserva');
select isnt((select lat from public.checkins where id = '60000000-0000-0000-0000-000000000002'), null::double precision,
  'el reciente conserva la ubicación');
select is((select count(*)::int from cron.job where jobname = 'purge-personal-data'), 1,
  'el borrado está programado con pg_cron');

-- El punto de entrada nocturno borra ubicaciones e intentos antiguos usando la hora real.
update public.checkins set created_at = now() - interval '70 days', lat = 1, lng = 1
where id = '60000000-0000-0000-0000-000000000002';
insert into app.rate_limit_events (user_id, action, created_at)
values ('00000000-0000-0000-0000-00000000000a', 'check_in', now() - interval '2 days');
select app.purge_personal_data();
select is((select lat from public.checkins where id = '60000000-0000-0000-0000-000000000002'), null::double precision,
  'el borrado nocturno purga las ubicaciones antiguas');
select is((select count(*)::int from app.rate_limit_events), 0, 'el borrado nocturno purga los intentos antiguos');

select * from finish();
rollback;
