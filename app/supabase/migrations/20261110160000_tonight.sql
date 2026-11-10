-- «Esta noche»: gustos del usuario, programación de los locales, prelista y datos agregados para recomendar.
-- Reglas de privacidad del brief: edad solo en tramos y solo con muestra suficiente; apuntados solo desde 15.

insert into app.config (key, value) values
  ('weight_music', '2'), ('weight_vibe', '2'), ('weight_age', '2'), ('weight_price', '1'),
  ('match_threshold', '0.6'), ('min_sample', '15'), ('age_window_days', '60');

-- Catálogos (los mismos valores que src/lib/tonight/catalog.ts)
create function app.music_catalog() returns text[] language sql immutable as $$
  select array['reggaeton', 'techno', 'house', 'pop', 'indie', 'jazz', 'flamenco', 'orquesta'] $$;
create function app.vibe_catalog() returns text[] language sql immutable as $$
  select array['bailar', 'hablar', 'directo', 'previa', 'verbena'] $$;
create function app.price_catalog() returns text[] language sql immutable as $$
  select array['€', '€€', '€€€'] $$;
create function app.age_band_catalog() returns text[] language sql immutable as $$
  select array['18-24', '25-30', '30-40', '40+'] $$;

-- Tramo de edad en una fecha: 18-24, 25-30 (hasta 30 incluido), 30-40 (31 a 40), 40+ (desde 41).
create function app.age_band(p_birthdate date, p_on date) returns text
language sql immutable as $$
  select case
    when extract(year from age(p_on, p_birthdate)) <= 24 then '18-24'
    when extract(year from age(p_on, p_birthdate)) <= 30 then '25-30'
    when extract(year from age(p_on, p_birthdate)) <= 40 then '30-40'
    else '40+'
  end
$$;

-- ---------------------------------------------------------------- Gustos
create table public.user_preferences (
  user_id     uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  music       text[] not null default '{}' check (music <@ app.music_catalog()),
  vibe        text[] not null default '{}' check (vibe <@ app.vibe_catalog()),
  price       text[] not null default '{}' check (price <@ app.price_catalog()),
  age_bands   text[] not null default '{}' check (age_bands <@ app.age_band_catalog()),
  updated_at  timestamptz not null default now()
);
alter table public.user_preferences enable row level security;
grant select, insert, update on public.user_preferences to authenticated;
create policy preferences_own on public.user_preferences for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------- Precio y programación por día
alter table public.places add column price_level text not null default '€€' check (price_level = any (app.price_catalog()));
grant update (price_level) on public.places to authenticated;

create table public.place_programming (
  place_id  uuid not null references public.places (id) on delete cascade,
  weekday   smallint not null check (weekday between 1 and 7),
  music     text not null check (music = any (app.music_catalog())),
  vibe      text not null check (vibe = any (app.vibe_catalog())),
  primary key (place_id, weekday)
);
alter table public.place_programming enable row level security;
grant select on public.place_programming to anon, authenticated;
grant insert, update, delete on public.place_programming to authenticated;
create policy programming_read on public.place_programming for select
  using (exists (select 1 from public.places p where p.id = place_id));
create policy programming_staff_write on public.place_programming for all to authenticated
  using ((select app.is_place_member(place_id))) with check ((select app.is_place_member(place_id)));

-- ---------------------------------------------------------------- Locales de esta noche (solo agregados)
create function app.tonight_places_at(p_now timestamptz)
returns table (
  id uuid, name text, zone text, kind text, lat double precision, lng double precision,
  price_level text, music text, vibe text, opens_at time, closes_at time,
  age_band text, age_source text, signups_visible integer, signups_any boolean, cover_path text
)
language sql stable security definer set search_path = '' as $$
  with base as (
    select p.*, app.night_date(p_now, c.timezone) as night
    from public.places p join public.cities c on c.id = p.city_id
    where p.is_active
  ),
  ages as (
    select c.place_id, app.age_band(pr.birthdate, c.night_date) as band, count(distinct c.user_id) as people
    from public.checkins c join public.profiles pr on pr.id = c.user_id
    where c.created_at > p_now - make_interval(days => app.config_int('age_window_days'))
    group by 1, 2
  ),
  age_mode as (
    select distinct on (place_id) place_id, band, sum(people) over (partition by place_id) as sample
    from ages order by place_id, people desc, band
  )
  select b.id, b.name, b.zone, b.kind,
         extensions.st_y(b.location::extensions.geometry), extensions.st_x(b.location::extensions.geometry),
         b.price_level, pg.music, pg.vibe, h.opens_at, h.closes_at,
         case when am.sample >= app.config_int('min_sample') then am.band else b.base_age_band end,
         case when am.sample >= app.config_int('min_sample') then 'checkins' else 'venue' end,
         case when s.total >= app.config_int('min_sample') then s.total end,
         coalesce(s.total, 0) > 0,
         (select ph.storage_path from public.place_photos ph where ph.place_id = b.id order by ph.created_at limit 1)
  from base b
  join public.place_opening_hours h on h.place_id = b.id and h.weekday = extract(isodow from b.night)
  left join public.place_programming pg on pg.place_id = b.id and pg.weekday = extract(isodow from b.night)
  left join age_mode am on am.place_id = b.id
  left join lateral (
    select count(*)::integer as total from public.signups su
    where su.place_id = b.id and su.night_date = b.night and su.cancelled_at is null
  ) s on true
  order by b.name
$$;

create function public.tonight_places()
returns table (
  id uuid, name text, zone text, kind text, lat double precision, lng double precision,
  price_level text, music text, vibe text, opens_at time, closes_at time,
  age_band text, age_source text, signups_visible integer, signups_any boolean, cover_path text
)
language sql stable security definer set search_path = '' as $$
  select * from app.tonight_places_at(now())
$$;

-- ---------------------------------------------------------------- Prelista
create function app.sign_up_at(p_user_id uuid, p_place_id uuid, p_now timestamptz) returns jsonb
language plpgsql as $$
declare
  v_tz text := app.active_place_timezone(p_place_id);
  v_night date;
  v_previous timestamptz;
begin
  if v_tz is null then
    return app.error_result('place_unavailable');
  end if;
  v_night := app.night_date(p_now, v_tz);
  select cancelled_at into v_previous from public.signups
  where user_id = p_user_id and place_id = p_place_id and night_date = v_night;
  if found and v_previous is null then
    return jsonb_build_object('ok', true, 'already', true);
  end if;
  insert into public.signups (user_id, place_id, night_date, is_spontaneous, created_at)
  values (p_user_id, p_place_id, v_night, false, p_now)
  on conflict (user_id, place_id, night_date) do update set cancelled_at = null;
  return jsonb_build_object('ok', true);
end $$;

create function app.cancel_signup_at(p_user_id uuid, p_place_id uuid, p_now timestamptz) returns jsonb
language sql as $$
  with cancelled as (
    update public.signups s set cancelled_at = p_now
    from public.places p join public.cities c on c.id = p.city_id
    where p.id = s.place_id and s.user_id = p_user_id and s.place_id = p_place_id
      and s.night_date = app.night_date(p_now, c.timezone) and s.cancelled_at is null
    returning 1
  )
  select case when exists (select 1 from cancelled) then jsonb_build_object('ok', true)
              else app.error_result('signup_not_found') end
$$;

create function public.sign_up(p_place_id uuid) returns jsonb
language sql security definer set search_path = '' as $$
  select app.sign_up_at((select auth.uid()), p_place_id, now())
$$;

create function public.cancel_signup(p_place_id uuid) returns jsonb
language sql security definer set search_path = '' as $$
  select app.cancel_signup_at((select auth.uid()), p_place_id, now())
$$;

-- ---------------------------------------------------------------- Ajustes de recomendación
create function public.recommendation_settings() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'weight_music', app.config_int('weight_music'),
    'weight_vibe', app.config_int('weight_vibe'),
    'weight_age', app.config_int('weight_age'),
    'weight_price', app.config_int('weight_price'),
    'match_threshold', (select (value #>> '{}')::numeric from app.config where key = 'match_threshold'))
$$;

-- ---------------------------------------------------------------- Borrar la cuenta (RGPD)
-- Borra el usuario de Auth; todo lo suyo cae en cascada. Las fotos que subió se conservan sin autor.
alter table public.place_photos alter column uploaded_by drop not null;
alter table public.place_photos drop constraint place_photos_uploaded_by_fkey;
alter table public.place_photos add constraint place_photos_uploaded_by_fkey
  foreign key (uploaded_by) references auth.users (id) on delete set null;

create function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
begin
  if v_user is null then
    raise exception using errcode = '42501', message = 'forbidden';
  end if;
  delete from app.rate_limit_events where user_id = v_user;
  delete from auth.users where id = v_user;
end $$;

-- ---------------------------------------------------------------- Permisos
revoke all on function app.tonight_places_at(timestamptz) from public, anon, authenticated;
revoke all on function app.sign_up_at(uuid, uuid, timestamptz) from public, anon, authenticated;
revoke all on function app.cancel_signup_at(uuid, uuid, timestamptz) from public, anon, authenticated;
revoke all on function public.sign_up(uuid), public.cancel_signup(uuid), public.delete_my_account() from public, anon;
grant execute on function public.sign_up(uuid), public.cancel_signup(uuid), public.delete_my_account() to authenticated;
grant execute on function public.tonight_places(), public.recommendation_settings() to anon, authenticated;
-- Los CHECK de user_preferences y place_programming llaman a los catálogos con el rol de quien escribe.
grant execute on function app.music_catalog(), app.vibe_catalog(), app.price_catalog(), app.age_band_catalog()
  to authenticated;
