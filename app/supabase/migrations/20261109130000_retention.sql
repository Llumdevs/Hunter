-- Retención de datos personales: la ubicación exacta de los check-ins se borra pasado un plazo.
-- Se conservan distance_m y geo_ok, que son la prueba de cada cobro.

create extension if not exists pg_cron;

insert into app.config (key, value) values ('location_retention_days', '60');

create function app.purge_checkin_locations(p_now timestamptz) returns integer
language sql as $$
  with purged as (
    update public.checkins
    set lat = null, lng = null
    where created_at < p_now - make_interval(days => app.config_int('location_retention_days'))
      and (lat is not null or lng is not null)
    returning 1
  )
  select count(*)::integer from purged
$$;

-- Punto de entrada único del borrado nocturno de datos personales.
create function app.purge_personal_data() returns void
language plpgsql as $$
begin
  perform app.purge_checkin_locations(now());
end $$;

revoke all on function app.purge_checkin_locations(timestamptz) from public, anon, authenticated;
revoke all on function app.purge_personal_data() from public, anon, authenticated;

-- Todos los días a las 04:30 UTC (05:30 o 06:30 en Madrid), fuera de horas de uso.
select cron.schedule('purge-personal-data', '30 4 * * *', $$select app.purge_personal_data()$$);
