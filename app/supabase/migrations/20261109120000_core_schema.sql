-- Núcleo de Hunter: lugares, ofertas, prelistas, check-ins y canjes.
-- Principios:
--   * RLS activado en todas las tablas de public; los clientes no escriben en check-ins ni canjes.
--   * Lo que se cobra (canjes) solo se crea mediante funciones del servidor (esquema app).
--   * El esquema app no se expone por la API; anon/authenticated no acceden a sus tablas.

create extension if not exists postgis with schema extensions;
create extension if not exists pgcrypto with schema extensions;

create schema if not exists app;
revoke all on schema app from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

create table public.cities (
  id        uuid primary key default gen_random_uuid(),
  name      text not null,
  timezone  text not null default 'Europe/Madrid'
);

create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text not null,
  birthdate     date not null,
  locale        text not null default 'es' check (locale in ('es', 'en')),
  created_at    timestamptz not null default now()
);

create table public.organizers (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('venue_owner', 'falla')),
  name        text not null,
  created_at  timestamptz not null default now()
);

create table public.organizer_members (
  organizer_id  uuid not null references public.organizers (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  role          text not null check (role in ('owner', 'staff')),
  primary key (organizer_id, user_id)
);

create table public.places (
  id             uuid primary key default gen_random_uuid(),
  city_id        uuid not null references public.cities (id),
  organizer_id   uuid not null references public.organizers (id),
  kind           text not null check (kind in ('bar', 'club', 'directo', 'previa', 'carpa')),
  slug           text not null unique,
  name           text not null,
  zone           text not null,
  address        text not null,
  location       extensions.geography(Point, 4326) not null,
  base_age_band  text check (base_age_band in ('18-24', '25-30', '30-40', '40+')),
  is_active      boolean not null default false,
  is_founder     boolean not null default false,
  created_at     timestamptz not null default now()
);

-- weekday = día ISO (1 lunes … 7 domingo) de la fecha en que empieza la noche.
-- closes_at puede ser menor que opens_at (cierra después de medianoche).
create table public.place_opening_hours (
  place_id   uuid not null references public.places (id) on delete cascade,
  weekday    smallint not null check (weekday between 1 and 7),
  opens_at   time not null,
  closes_at  time not null,
  primary key (place_id, weekday)
);

create table app.place_qr (
  place_id       uuid primary key references public.places (id) on delete cascade,
  static_token   text not null unique,
  screen_secret  bytea not null,
  revoked_at     timestamptz
);

create table public.offers (
  id                uuid primary key default gen_random_uuid(),
  place_id          uuid not null references public.places (id) on delete cascade,
  title             text not null,
  description       text,
  includes_alcohol  boolean not null,
  days_of_week      smallint[] not null check (days_of_week <@ array[1,2,3,4,5,6,7]::smallint[]),
  valid_until_time  time,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now()
);

create table public.signups (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  place_id        uuid not null references public.places (id),
  night_date      date not null,
  is_spontaneous  boolean not null,
  created_at      timestamptz not null default now(),
  cancelled_at    timestamptz,
  unique (user_id, place_id, night_date)
);

create table public.checkins (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  place_id    uuid not null references public.places (id),
  signup_id   uuid references public.signups (id),
  night_date  date not null,
  created_at  timestamptz not null default now(),
  qr_kind     text not null check (qr_kind in ('static', 'screen')),
  lat         double precision,
  lng         double precision,
  distance_m  integer,
  geo_ok      boolean not null,
  flagged     boolean not null default false,
  unique (user_id, place_id, night_date)
);

create table public.redemptions (
  id              uuid primary key default gen_random_uuid(),
  checkin_id      uuid not null unique references public.checkins (id) on delete cascade,
  offer_id        uuid not null references public.offers (id),
  offer_snapshot  jsonb not null,
  is_first_visit  boolean not null,
  billable        boolean not null,
  created_at      timestamptz not null,
  expires_at      timestamptz not null
);

create table app.config (
  key    text primary key,
  value  jsonb not null
);

insert into app.config (key, value) values
  ('checkin_radius_m', '150'),
  ('redemption_window_min', '15'),
  ('screen_code_step_s', '30'),
  ('adult_age', '18');

create index on public.checkins (place_id, night_date);
create index on public.redemptions (offer_id);
create index on public.offers (place_id);
create index on public.signups (place_id, night_date);

-- ---------------------------------------------------------------------------
-- Reglas de tiempo (funciones puras, testeadas aparte)
-- ---------------------------------------------------------------------------

-- Hora a partir de la cual empieza un nuevo "día de servicio".
create function app.service_day_start() returns time
language sql immutable as $$ select time '08:00' $$;

-- Noche a la que pertenece un instante cuando no hay horario (eventos): de 18:00 a 08:00,
-- asignada a la fecha de inicio. Los check-ins en locales usan app.opening_session.
create function app.night_date(p_ts timestamptz, p_tz text) returns date
language sql stable as $$
  select ((p_ts at time zone p_tz) - (app.service_day_start() - time '00:00'))::date
$$;

-- Sesión de apertura que contiene una hora local: devuelve la fecha en que empezó, o null si está cerrado.
-- Un cierre igual o anterior a la apertura significa que cierra al día siguiente (p. ej. 23:00-09:00).
create function app.opening_session(p_place_id uuid, p_local timestamp) returns date
language sql stable as $$
  select d.day
  from (values (p_local::date), (p_local::date - 1)) d (day)
  join public.place_opening_hours h
    on h.place_id = p_place_id and h.weekday = extract(isodow from d.day)
  where p_local >= d.day + h.opens_at
    and p_local < d.day + h.closes_at
                  + case when h.closes_at <= h.opens_at then interval '1 day' else interval '0' end
  order by d.day desc
  limit 1
$$;

-- Hora límite de una oferta dentro de una sesión: si es anterior a la apertura, cae al día siguiente.
create function app.offer_deadline(p_place_id uuid, p_session date, p_until time) returns timestamp
language sql stable as $$
  select p_session + p_until + case when p_until < h.opens_at then interval '1 day' else interval '0' end
  from public.place_opening_hours h
  where h.place_id = p_place_id and h.weekday = extract(isodow from p_session)
$$;

-- Código del QR de pantalla: 8 primeros hex de HMAC-SHA256(secreto, paso).
-- El navegador del local calcula lo mismo con WebCrypto.
create function app.screen_code(p_secret bytea, p_step bigint) returns text
language sql immutable as $$
  select substr(encode(extensions.hmac(convert_to(p_step::text, 'UTF8'), p_secret, 'sha256'), 'hex'), 1, 8)
$$;

create function app.config_int(p_key text) returns integer
language sql stable as $$ select (value #>> '{}')::integer from app.config where key = p_key $$;

create function app.fail(p_code text) returns void
language plpgsql as $$ begin raise exception using errcode = 'P0001', message = p_code; end $$;

-- ---------------------------------------------------------------------------
-- Check-in
-- ---------------------------------------------------------------------------

create function app.assert_adult(p_user_id uuid, p_local_date date) returns void
language plpgsql as $$
begin
  if not exists (
    select 1 from public.profiles
    where id = p_user_id
      and birthdate <= p_local_date - make_interval(years => app.config_int('adult_age'))
  ) then
    perform app.fail('not_adult');
  end if;
end $$;

create function app.screen_step(p_now timestamptz) returns bigint
language sql stable as $$
  select floor(extract(epoch from p_now) / app.config_int('screen_code_step_s'))::bigint
$$;

-- Vale el QR fijo no revocado, o el código de pantalla del paso anterior, actual o siguiente
-- (tolera hasta 30 s de desfase de reloj en el dispositivo del local).
create function app.is_valid_qr(p_place_id uuid, p_static_token text, p_screen_code text, p_now timestamptz)
returns boolean
language sql stable as $$
  select exists (
    select 1 from app.place_qr q
    where q.place_id = p_place_id
      and q.revoked_at is null
      and (q.static_token = p_static_token
           or p_screen_code in (app.screen_code(q.screen_secret, app.screen_step(p_now) - 1),
                                app.screen_code(q.screen_secret, app.screen_step(p_now)),
                                app.screen_code(q.screen_secret, app.screen_step(p_now) + 1)))
  )
$$;

-- Distancia en metros al lugar, o null si no hay ubicación. Falla si la ubicación es inválida.
create function app.distance_to_place(p_place_id uuid, p_lat double precision, p_lng double precision)
returns integer
language plpgsql as $$
begin
  if p_lat is null and p_lng is null then
    return null;
  end if;
  if p_lat is null or p_lng is null or p_lat not between -90 and 90 or p_lng not between -180 and 180 then
    perform app.fail('invalid_location');
  end if;
  return (select round(extensions.st_distance(location,
            extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography))::integer
          from public.places where id = p_place_id);
end $$;

-- Prelista del usuario para esa noche; si no existe, se crea como espontánea.
create function app.ensure_signup(p_user_id uuid, p_place_id uuid, p_night date) returns uuid
language plpgsql as $$
declare
  v_id uuid;
begin
  insert into public.signups (user_id, place_id, night_date, is_spontaneous)
  values (p_user_id, p_place_id, p_night, true)
  on conflict (user_id, place_id, night_date) do nothing
  returning id into v_id;
  if v_id is null then
    select id into v_id from public.signups
    where user_id = p_user_id and place_id = p_place_id and night_date = p_night;
  end if;
  return v_id;
end $$;

create function app.active_place_timezone(p_place_id uuid) returns text
language sql stable as $$
  select c.timezone from public.places p join public.cities c on c.id = p.city_id
  where p.id = p_place_id and p.is_active
$$;

create function app.check_in_at(
  p_user_id uuid, p_place_id uuid, p_static_token text, p_screen_code text,
  p_lat double precision, p_lng double precision, p_now timestamptz)
returns public.checkins
language plpgsql as $$
declare
  v_tz        text := app.active_place_timezone(p_place_id);
  v_local     timestamp;
  v_night     date;
  v_distance  integer;
  v_row       public.checkins;
begin
  if v_tz is null then
    perform app.fail('place_unavailable');
  end if;
  v_local := p_now at time zone v_tz;

  perform app.assert_adult(p_user_id, v_local::date);
  if not app.is_valid_qr(p_place_id, p_static_token, p_screen_code, p_now) then
    perform app.fail('qr_invalid');
  end if;
  v_distance := app.distance_to_place(p_place_id, p_lat, p_lng);
  if v_distance > app.config_int('checkin_radius_m') then
    perform app.fail('too_far');
  end if;
  v_night := app.opening_session(p_place_id, v_local);
  if v_night is null then
    perform app.fail('place_closed');
  end if;

  begin
    insert into public.checkins (user_id, place_id, signup_id, night_date, created_at,
                                 qr_kind, lat, lng, distance_m, geo_ok, flagged)
    values (p_user_id, p_place_id, app.ensure_signup(p_user_id, p_place_id, v_night), v_night, p_now,
            case when p_static_token is not null then 'static' else 'screen' end,
            p_lat, p_lng, v_distance, v_distance is not null, v_distance is null)
    returning * into v_row;
  exception when unique_violation then
    perform app.fail('already_checked_in');
  end;
  return v_row;
end $$;

-- ---------------------------------------------------------------------------
-- Canje (lo que se cobra)
-- ---------------------------------------------------------------------------

create function app.is_first_visit(p_user_id uuid, p_place_id uuid) returns boolean
language sql stable as $$
  select not exists (
    select 1 from public.redemptions r join public.checkins c on c.id = r.checkin_id
    where c.user_id = p_user_id and c.place_id = p_place_id)
$$;

create function app.redeem_at(p_user_id uuid, p_checkin_id uuid, p_offer_id uuid, p_now timestamptz)
returns public.redemptions
language plpgsql as $$
declare
  v_checkin  public.checkins;
  v_offer    public.offers;
  v_tz       text;
  v_local    timestamp;
  v_first    boolean;
  v_row      public.redemptions;
begin
  select * into v_checkin from public.checkins where id = p_checkin_id and user_id = p_user_id;
  if v_checkin.id is null then
    perform app.fail('checkin_not_found');
  end if;

  select c.timezone into v_tz
  from public.places p join public.cities c on c.id = p.city_id where p.id = v_checkin.place_id;
  v_local := p_now at time zone v_tz;
  if app.opening_session(v_checkin.place_id, v_local) is distinct from v_checkin.night_date then
    perform app.fail('checkin_expired');
  end if;

  select * into v_offer from public.offers
  where id = p_offer_id and place_id = v_checkin.place_id and is_active
    and extract(isodow from v_checkin.night_date)::smallint = any (days_of_week);
  if v_offer.id is null then
    perform app.fail('offer_unavailable');
  end if;
  if v_local > app.offer_deadline(v_checkin.place_id, v_checkin.night_date, v_offer.valid_until_time) then
    perform app.fail('offer_expired');
  end if;

  v_first := app.is_first_visit(p_user_id, v_checkin.place_id);
  begin
    insert into public.redemptions (checkin_id, offer_id, offer_snapshot, is_first_visit, billable,
                                    created_at, expires_at)
    values (v_checkin.id, v_offer.id,
            jsonb_build_object('title', v_offer.title, 'description', v_offer.description,
                               'includes_alcohol', v_offer.includes_alcohol),
            v_first, v_first and v_checkin.geo_ok,
            p_now, p_now + make_interval(mins => app.config_int('redemption_window_min')))
    returning * into v_row;
  exception when unique_violation then
    perform app.fail('already_redeemed');
  end;
  return v_row;
end $$;

-- ---------------------------------------------------------------------------
-- API pública: usa el usuario de la sesión y la hora real. Únicas puertas de escritura.
-- ---------------------------------------------------------------------------

create function public.check_in(
  p_place_id uuid, p_static_token text, p_screen_code text,
  p_lat double precision, p_lng double precision)
returns public.checkins
language sql security definer set search_path = '' as $$
  select * from app.check_in_at((select auth.uid()), p_place_id, p_static_token, p_screen_code,
                                p_lat, p_lng, now())
$$;

create function public.redeem(p_checkin_id uuid, p_offer_id uuid)
returns public.redemptions
language sql security definer set search_path = '' as $$
  select * from app.redeem_at((select auth.uid()), p_checkin_id, p_offer_id, now())
$$;

-- ¿Es el usuario de la sesión miembro del organizador de este lugar? (usado por las políticas RLS)
create function app.is_place_member(p_place_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.places p
    join public.organizer_members m on m.organizer_id = p.organizer_id
    where p.id = p_place_id and m.user_id = (select auth.uid()))
$$;

-- ---------------------------------------------------------------------------
-- Permisos
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from anon, authenticated;
revoke all on all tables in schema app from public, anon, authenticated;
revoke all on all functions in schema app from public, anon, authenticated;
revoke all on function public.check_in(uuid, text, text, double precision, double precision) from public, anon;
revoke all on function public.redeem(uuid, uuid) from public, anon;
grant execute on function public.check_in(uuid, text, text, double precision, double precision) to authenticated;
grant execute on function public.redeem(uuid, uuid) to authenticated;

-- authenticated necesita USAGE en app solo para evaluar app.is_place_member dentro de las políticas;
-- no tiene permisos sobre ninguna tabla ni otra función de app.
grant usage on schema app to authenticated;
grant execute on function app.is_place_member(uuid) to authenticated;

alter table public.cities              enable row level security;
alter table public.profiles            enable row level security;
alter table public.organizers          enable row level security;
alter table public.organizer_members   enable row level security;
alter table public.places              enable row level security;
alter table public.place_opening_hours enable row level security;
alter table public.offers              enable row level security;
alter table public.signups             enable row level security;
alter table public.checkins            enable row level security;
alter table public.redemptions         enable row level security;

-- Catálogo público
grant select on public.cities, public.places, public.place_opening_hours, public.offers to anon, authenticated;
create policy cities_read on public.cities for select using (true);
create policy places_read_active on public.places for select using (is_active);
create policy places_read_member on public.places for select to authenticated
  using ((select app.is_place_member(id)));
create policy hours_read on public.place_opening_hours for select
  using (exists (select 1 from public.places p where p.id = place_id));
create policy offers_read on public.offers for select
  using (exists (select 1 from public.places p where p.id = place_id));

-- Edición por el personal del local (solo columnas de contenido)
grant update (name, zone, address, base_age_band) on public.places to authenticated;
create policy places_staff_update on public.places for update to authenticated
  using ((select app.is_place_member(id))) with check ((select app.is_place_member(id)));

grant insert, update (title, description, includes_alcohol, days_of_week, valid_until_time, is_active)
  on public.offers to authenticated;
create policy offers_staff_insert on public.offers for insert to authenticated
  with check ((select app.is_place_member(place_id)));
create policy offers_staff_update on public.offers for update to authenticated
  using ((select app.is_place_member(place_id))) with check ((select app.is_place_member(place_id)));

-- Datos del propio usuario
grant select, update (display_name, locale) on public.profiles to authenticated;
create policy profiles_own_read on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy profiles_own_update on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

grant select on public.signups, public.checkins, public.redemptions to authenticated;
create policy signups_own_read on public.signups for select to authenticated using (user_id = (select auth.uid()));
create policy checkins_own_read on public.checkins for select to authenticated using (user_id = (select auth.uid()));
create policy redemptions_own_read on public.redemptions for select to authenticated
  using (exists (select 1 from public.checkins c where c.id = checkin_id and c.user_id = (select auth.uid())));

-- Organizadores: cada usuario ve sus membresías y sus organizadores.
grant select on public.organizer_members, public.organizers to authenticated;
create policy members_own_read on public.organizer_members for select to authenticated
  using (user_id = (select auth.uid()));
create policy organizers_member_read on public.organizers for select to authenticated
  using (exists (select 1 from public.organizer_members m
                 where m.organizer_id = id and m.user_id = (select auth.uid())));
