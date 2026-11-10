-- Local demo personal y solicitudes de alta. No se asigna ningún administrador.
alter table public.places add column is_demo boolean not null default false;
alter table public.places add column demo_owner_id uuid unique references auth.users(id) on delete cascade;
alter table public.places add constraint private_demo_place check (
  (not is_demo and demo_owner_id is null) or (is_demo and demo_owner_id is not null and not is_active)
);

create table app.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
revoke all on app.platform_admins from public, anon, authenticated;

create function app.is_platform_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from app.platform_admins a join auth.users u on u.id = a.user_id
    where a.user_id = auth.uid() and u.email_confirmed_at is not null and not coalesce(u.is_anonymous, false))
$$;
revoke all on function app.is_platform_admin() from public, anon;
grant execute on function app.is_platform_admin() to authenticated;

create table public.venue_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  details jsonb not null check (jsonb_typeof(details) = 'object'),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  decision_note text not null default '' check (char_length(decision_note) <= 500),
  place_id uuid references public.places(id)
);
create index venue_applications_owner on public.venue_applications(applicant_id, created_at);
create index venue_applications_pending on public.venue_applications(created_at) where status = 'pending';
alter table public.venue_applications enable row level security;
revoke all on public.venue_applications from public, anon, authenticated;
grant select on public.venue_applications to authenticated;
create policy venue_applications_own_or_admin on public.venue_applications for select to authenticated
  using (applicant_id = (select auth.uid()) or (select app.is_platform_admin()));

create function public.venue_management_context() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('is_admin', app.is_platform_admin(), 'approvals_enabled',
    exists (select 1 from app.platform_admins a join auth.users u on u.id = a.user_id
      where u.email_confirmed_at is not null and not coalesce(u.is_anonymous, false)), 'demo_place_id',
    (select id from public.places where is_demo and demo_owner_id = auth.uid()))
$$;

create function public.create_my_demo_venue() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_place uuid;
  v_city uuid;
  v_org uuid := gen_random_uuid();
begin
  if auth.uid() is null then return app.error_result('forbidden'); end if;
  perform 1 from public.profiles where id = auth.uid() and birthdate <= current_date - interval '18 years' for update;
  if not found then return app.error_result('profile_required'); end if;
  select id into v_place from public.places where demo_owner_id = auth.uid();
  if found then return jsonb_build_object('ok', true, 'place_id', v_place); end if;
  perform pg_advisory_xact_lock(hashtext('hunter:venue-city-valencia'));
  select id into v_city from public.cities where name = 'Valencia' and timezone = 'Europe/Madrid' order by id limit 1;
  if v_city is null then insert into public.cities(name, timezone) values ('Valencia', 'Europe/Madrid') returning id into v_city; end if;
  v_place := gen_random_uuid();
  insert into public.organizers(id, kind, name) values (v_org, 'venue_owner', 'Organizador demo');
  insert into public.organizer_members(organizer_id, user_id, role) values (v_org, auth.uid(), 'owner');
  insert into public.places(id, city_id, organizer_id, kind, slug, name, zone, address, location, is_active, is_demo, demo_owner_id)
    values (v_place, v_city, v_org, 'bar', 'demo-' || v_place, 'Mi local de prueba · Demo', 'Ruzafa',
      'Dirección ficticia de prueba, Valencia', extensions.st_setsrid(extensions.st_makepoint(-0.3752, 39.4608), 4326)::extensions.geography,
      false, true, auth.uid());
  insert into public.place_opening_hours(place_id, weekday, opens_at, closes_at)
    select v_place, d, '20:00', '03:00' from generate_series(1,7) d;
  insert into public.place_programming(place_id, weekday, music, vibe)
    select v_place, d, 'house', 'bailar' from generate_series(1,7) d;
  insert into app.place_qr(place_id, static_token, screen_secret)
    values (v_place, encode(extensions.gen_random_bytes(24), 'hex'), extensions.gen_random_bytes(32));
  insert into public.offers(place_id, title, description, includes_alcohol, days_of_week)
    values (v_place, 'Tapa de bienvenida · Demo', 'Oferta ficticia para aprender a usar el panel.', false, '{1,2,3,4,5,6,7}'),
      (v_place, 'Entrada reducida · Demo', 'Otra oferta de ejemplo que puedes editar o pausar.', false, '{5,6,7}');
  return jsonb_build_object('ok', true, 'place_id', v_place);
end $$;

create function app.cleanup_demo_organizer() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.is_demo and not exists (select 1 from public.places where organizer_id = old.organizer_id) then
    delete from public.organizer_members where organizer_id = old.organizer_id;
    delete from public.organizers where id = old.organizer_id;
  end if;
  return old;
end $$;
revoke all on function app.cleanup_demo_organizer() from public, anon, authenticated;
create trigger cleanup_demo_organizer after delete on public.places for each row execute function app.cleanup_demo_organizer();

create function public.submit_venue_application(p_details jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_name text; v_zone text; v_address text; v_kind text; v_contact text; v_price text;
  v_lat double precision; v_lng double precision; v_opens time; v_closes time; v_days smallint[];
  v_id uuid;
begin
  if auth.uid() is null then return app.error_result('forbidden'); end if;
  perform 1 from public.profiles where id = auth.uid() and birthdate <= current_date - interval '18 years' for update;
  if not found then return app.error_result('profile_required'); end if;
  if (select count(*) from public.venue_applications where applicant_id = auth.uid() and created_at > now() - interval '1 day') >= 5 then
    return app.error_result('rate_limited');
  end if;
  if (select count(*) from public.venue_applications where applicant_id = auth.uid() and status = 'pending') >= 3 then
    return app.error_result('pending_limit');
  end if;
  if p_details is null or jsonb_typeof(p_details) <> 'object' then return app.error_result('invalid_application'); end if;
  if exists (select 1 from unnest(array['name','zone','address','kind','contact','price','opens_at','closes_at']) field
    where jsonb_typeof(p_details->field) is distinct from 'string')
    or jsonb_typeof(p_details->'lat') is distinct from 'number'
    or jsonb_typeof(p_details->'lng') is distinct from 'number'
    or jsonb_typeof(p_details->'days') is distinct from 'array' then return app.error_result('invalid_application'); end if;
  v_name := btrim(p_details->>'name'); v_zone := btrim(p_details->>'zone');
  v_address := btrim(p_details->>'address'); v_contact := btrim(p_details->>'contact');
  v_kind := p_details->>'kind'; v_price := p_details->>'price';
  if char_length(v_name) not between 2 and 80 or char_length(v_zone) not between 2 and 60
    or char_length(v_address) not between 5 and 200 or char_length(v_contact) not between 8 and 120
    or v_kind not in ('bar','club','directo','previa') or v_price not in ('€','€€','€€€')
    or (p_details->>'opens_at') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
    or (p_details->>'closes_at') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
    or jsonb_array_length(p_details->'days') not between 1 and 7 then return app.error_result('invalid_application'); end if;
  begin
    v_lat := (p_details->>'lat')::double precision; v_lng := (p_details->>'lng')::double precision;
    v_opens := (p_details->>'opens_at')::time; v_closes := (p_details->>'closes_at')::time;
    if exists (select 1 from jsonb_array_elements(p_details->'days') d where jsonb_typeof(d) <> 'number' or d::text !~ '^[1-7]$') then
      return app.error_result('invalid_application'); end if;
    select array_agg(distinct d::smallint order by d::smallint) into v_days from jsonb_array_elements_text(p_details->'days') d;
  exception when invalid_text_representation or numeric_value_out_of_range or invalid_datetime_format or datetime_field_overflow then
    return app.error_result('invalid_application');
  end;
  if not (v_lat between -90 and 90 and v_lng between -180 and 180) then return app.error_result('invalid_application'); end if;
  insert into public.venue_applications(details) values (jsonb_build_object('name',v_name,'zone',v_zone,'address',v_address,
    'contact',v_contact,'kind',v_kind,'price',v_price,'lat',v_lat,'lng',v_lng,'opens_at',p_details->>'opens_at',
    'closes_at',p_details->>'closes_at','days',to_jsonb(v_days),'city','Valencia')) returning id into v_id;
  return jsonb_build_object('ok', true, 'application_id', v_id);
end $$;

create function public.cancel_venue_application(p_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  update public.venue_applications set status = 'cancelled'
    where id = p_id and applicant_id = auth.uid() and status = 'pending';
  if not found then return app.error_result('application_unavailable'); end if;
  return jsonb_build_object('ok', true);
end $$;

create function public.review_venue_application(p_id uuid, p_approve boolean, p_note text default '') returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  application public.venue_applications%rowtype;
  v_place uuid := gen_random_uuid(); v_org uuid := gen_random_uuid(); v_city uuid;
begin
  if not app.is_platform_admin() then return app.error_result('forbidden'); end if;
  if p_approve is null or p_note is null or char_length(btrim(p_note)) > 500
    or (not p_approve and char_length(btrim(p_note)) < 10) then return app.error_result('invalid_decision'); end if;
  select * into application from public.venue_applications where id = p_id for update;
  if not found or application.status <> 'pending' then return app.error_result('application_unavailable'); end if;
  if p_approve then
    perform pg_advisory_xact_lock(hashtext('hunter:venue-city-valencia'));
    select id into v_city from public.cities where name = 'Valencia' and timezone = 'Europe/Madrid' order by id limit 1;
    if v_city is null then insert into public.cities(name, timezone) values ('Valencia', 'Europe/Madrid') returning id into v_city; end if;
    insert into public.organizers(id, kind, name) values (v_org, 'venue_owner', application.details->>'name');
    insert into public.organizer_members(organizer_id, user_id, role) values (v_org, application.applicant_id, 'owner');
    insert into public.places(id, city_id, organizer_id, kind, slug, name, zone, address, location, is_active, price_level)
      values (v_place, v_city, v_org, application.details->>'kind', 'local-' || v_place, application.details->>'name',
        application.details->>'zone', application.details->>'address',
        extensions.st_setsrid(extensions.st_makepoint((application.details->>'lng')::double precision,
          (application.details->>'lat')::double precision),4326)::extensions.geography, true, application.details->>'price');
    insert into public.place_opening_hours(place_id, weekday, opens_at, closes_at)
      select v_place, d::smallint, (application.details->>'opens_at')::time, (application.details->>'closes_at')::time
      from jsonb_array_elements_text(application.details->'days') d;
    insert into app.place_qr(place_id, static_token, screen_secret)
      values (v_place, encode(extensions.gen_random_bytes(24),'hex'), extensions.gen_random_bytes(32));
  end if;
  update public.venue_applications set status = case when p_approve then 'approved' else 'rejected' end,
    reviewed_at = now(), reviewed_by = auth.uid(), decision_note = btrim(p_note), place_id = case when p_approve then v_place end
    where id = p_id;
  return jsonb_build_object('ok', true, 'place_id', case when p_approve then v_place end);
end $$;

revoke all on function public.venue_management_context(), public.create_my_demo_venue(),
  public.submit_venue_application(jsonb), public.cancel_venue_application(uuid), public.review_venue_application(uuid,boolean,text)
  from public, anon;
grant execute on function public.venue_management_context(), public.create_my_demo_venue(),
  public.submit_venue_application(jsonb), public.cancel_venue_application(uuid), public.review_venue_application(uuid,boolean,text)
  to authenticated;
