-- Lectura pública estable y mínima. No publica locales ni crea administradores.
create function app.place_accepts_signup(p_place uuid, p_now timestamptz) returns boolean
language sql stable set search_path = '' as $$
  select coalesce((select
    app.opening_session(p.id, p_now at time zone c.timezone) is not null
    or exists(select 1 from public.place_opening_hours h
      where h.place_id=p.id and h.weekday=extract(isodow from app.night_date(p_now,c.timezone))
        and (p_now at time zone c.timezone) < app.night_date(p_now,c.timezone)+h.opens_at)
    from public.places p join public.cities c on c.id=p.city_id
    where p.id=p_place and p.is_active and not p.is_demo),false)
$$;
revoke all on function app.place_accepts_signup(uuid,timestamptz) from public,anon,authenticated;

create function app.public_place_at(p_place uuid, p_now timestamptz) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id',p.id,'name',p.name,'zone',p.zone,'kind',p.kind,'address',p.address,
    'city',c.name,'timezone',c.timezone,
    'lat',extensions.st_y(p.location::extensions.geometry),'lng',extensions.st_x(p.location::extensions.geometry),
    'price_level',p.price_level,'age_band',coalesce(t.age_band,p.base_age_band),'age_source',coalesce(t.age_source,'venue'),
    'music',pg.music,'vibe',pg.vibe,'opens_at',h.opens_at,'closes_at',h.closes_at,
    'signups_visible',t.signups_visible,'signups_any',coalesce(t.signups_any,false),
    'is_open',app.opening_session(p.id,p_now at time zone c.timezone) is not null,
    'accepting_signups',app.place_accepts_signup(p.id,p_now),
    'cover_path',(select ph.storage_path from public.place_photos ph where ph.place_id=p.id order by ph.created_at,ph.id limit 1),
    'opening_hours',coalesce((select jsonb_agg(jsonb_build_object('weekday',oh.weekday,'opens_at',oh.opens_at,'closes_at',oh.closes_at) order by oh.weekday) from public.place_opening_hours oh where oh.place_id=p.id),'[]'::jsonb),
    'photos',coalesce((select jsonb_agg(photo order by created_at,id) from (select ph.id,ph.created_at,jsonb_build_object('storage_path',ph.storage_path) photo from public.place_photos ph where ph.place_id=p.id order by ph.created_at,ph.id limit 12) photos),'[]'::jsonb)
  )
  from public.places p join public.cities c on c.id=p.city_id
  left join public.place_opening_hours h on h.place_id=p.id and h.weekday=extract(isodow from app.night_date(p_now,c.timezone))
  left join public.place_programming pg on pg.place_id=p.id and pg.weekday=extract(isodow from app.night_date(p_now,c.timezone))
  left join app.tonight_places_at(p_now) t on t.id=p.id
  where p.id=p_place and p.is_active and not p.is_demo and p.demo_owner_id is null
$$;
revoke all on function app.public_place_at(uuid,timestamptz) from public,anon,authenticated;
create function public.public_place(p_place uuid) returns jsonb
language sql stable security definer set search_path = '' as $$ select app.public_place_at(p_place,now()) $$;
revoke all on function public.public_place(uuid) from public;
grant execute on function public.public_place(uuid) to anon,authenticated;

-- No entregar la identidad del personal que subió las fotos a visitantes o clientes.
revoke select on public.place_photos from anon,authenticated;
grant select(id,place_id,storage_path,created_at) on public.place_photos to anon,authenticated;

-- Mantener prelistas antes de abrir o durante la apertura, nunca tras el cierre
-- ni en un día sin programación. La API también exige perfil adulto, sin fiarse del cliente.
create or replace function app.sign_up_at(p_user_id uuid,p_place_id uuid,p_now timestamptz) returns jsonb
language plpgsql set search_path = '' as $$
declare v_tz text := app.active_place_timezone(p_place_id); v_night date; v_previous timestamptz;
begin
  if p_user_id is null then return app.error_result('forbidden'); end if;
  if v_tz is null then return app.error_result('place_unavailable'); end if;
  if not exists(select 1 from public.profiles where id=p_user_id) then return app.error_result('profile_required'); end if;
  if not exists(select 1 from public.profiles where id=p_user_id and birthdate <= (p_now at time zone v_tz)::date-make_interval(years=>app.config_int('adult_age'))) then return app.error_result('not_adult'); end if;
  if not app.place_accepts_signup(p_place_id,p_now) then return app.error_result('place_closed'); end if;
  v_night:=app.night_date(p_now,v_tz);
  select cancelled_at into v_previous from public.signups where user_id=p_user_id and place_id=p_place_id and night_date=v_night;
  if found and v_previous is null then return jsonb_build_object('ok',true,'already',true); end if;
  insert into public.signups(user_id,place_id,night_date,is_spontaneous,created_at) values(p_user_id,p_place_id,v_night,false,p_now)
    on conflict(user_id,place_id,night_date) do update set cancelled_at=null;
  return jsonb_build_object('ok',true);
end $$;
