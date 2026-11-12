-- Compras validadas, invitaciones y ranking piloto. No crea administradores.
-- Los puntos anteriores quedan como histórico; no se trasladan al nuevo ranking.
create table app.purchase_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  place_id uuid not null references public.places(id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz
);
create index purchase_request_user on app.purchase_requests(user_id, created_at);
revoke all on app.purchase_requests from public, anon, authenticated;

create table public.validated_purchases (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references app.purchase_requests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  place_id uuid not null references public.places(id) on delete cascade,
  validated_by uuid references auth.users(id) on delete set null,
  validated_at timestamptz not null default now(),
  business_night date not null,
  receipt_day date not null,
  receipt_hash text not null,
  operation_id uuid not null unique,
  is_demo boolean not null,
  cancelled_at timestamptz,
  cancelled_by uuid references auth.users(id) on delete set null,
  cancellation_reason text check (char_length(cancellation_reason) between 5 and 200),
  unique(place_id, receipt_day, receipt_hash)
);
create index purchases_user on public.validated_purchases(user_id, validated_at);
create index purchases_place on public.validated_purchases(place_id, validated_at);
create table public.referrals (
  invited_user_id uuid primary key references auth.users(id) on delete cascade,
  inviter_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (invited_user_id <> inviter_user_id)
);
create index referrals_inviter on public.referrals(inviter_user_id);
create table public.point_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  purchase_id uuid not null references public.validated_purchases(id) on delete cascade,
  kind text not null check (kind in ('purchase','referral')),
  points integer not null check ((kind='purchase' and points=10) or (kind='referral' and points=20)),
  referral_user_id uuid references auth.users(id) on delete cascade,
  points_month date not null check (extract(day from points_month)=1),
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  check ((kind='referral') = (referral_user_id is not null)),
  unique(purchase_id, kind, user_id)
);
create unique index one_active_referral_reward on public.point_events(referral_user_id) where kind='referral' and revoked_at is null;
create index points_month_user on public.point_events(points_month, user_id) where revoked_at is null;
create table public.ranking_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  alias text not null check (char_length(btrim(alias)) between 3 and 24 and alias ~ '^[[:alnum:] _-]+$'),
  participating boolean not null default false
);
create unique index ranking_alias_unique on public.ranking_profiles(lower(alias)) where participating;

alter table public.validated_purchases enable row level security;
alter table public.referrals enable row level security;
alter table public.point_events enable row level security;
alter table public.ranking_profiles enable row level security;
-- Solo las RPC exponen datos mínimos; ni el personal recibe identificadores o perfiles de clientes.
revoke all on public.validated_purchases, public.referrals, public.point_events, public.ranking_profiles from public, anon, authenticated;
alter table app.rate_limit_events drop constraint rate_limit_events_action_check;
alter table app.rate_limit_events add constraint rate_limit_events_action_check check (action in ('check_in','redeem','friend_request','purchase_request','referral_claim'));

create function app.points_month(p_at timestamptz) returns date language sql immutable as $$
  select date_trunc('month', p_at at time zone 'Europe/Madrid')::date
$$;
create function app.points_rules() returns jsonb language sql immutable as $$
  select '{"purchase_points":10,"daily_purchase_limit":3,"referral_points":20,"monthly_referral_limit":5,"token_ttl_seconds":300,"timezone":"Europe/Madrid","prize":{"title":"Dos entradas a una experiencia cultural · Ejemplo","description":"Premio ficticio de prueba. Sin patrocinador, sin entrega real ni adjudicación automática."}}'::jsonb
$$;
revoke all on function app.points_month(timestamptz), app.points_rules() from public, anon, authenticated;

create function public.purchase_venues() returns jsonb language sql stable security definer set search_path='' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'zone',p.zone,'is_demo',p.is_demo) order by p.is_demo,p.name),'[]'::jsonb)
  from public.places p where p.is_active or (p.is_demo and p.demo_owner_id=auth.uid())
$$;
create function public.create_purchase_request(p_place uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_place public.places%rowtype; v_token text; v_expires timestamptz := now()+interval '5 minutes';
begin
  if auth.uid() is null then return app.error_result('forbidden'); end if;
  perform 1 from public.profiles where id=auth.uid() and birthdate<=current_date-interval '18 years' for update;
  if not found then return app.error_result('profile_required'); end if;
  if not app.register_attempt(auth.uid(),'purchase_request',now()) then return app.error_result('rate_limited'); end if;
  select * into v_place from public.places where id=p_place;
  if not found or (not v_place.is_active and not (v_place.is_demo and v_place.demo_owner_id=auth.uid())) then return app.error_result('place_unavailable'); end if;
  if not v_place.is_demo and exists(select 1 from public.organizer_members where user_id=auth.uid() and organizer_id=v_place.organizer_id) then
    return app.error_result('staff_cannot_earn');
  end if;
  update app.purchase_requests set expires_at=least(expires_at,now()) where user_id=auth.uid() and consumed_at is null;
  v_token := encode(extensions.gen_random_bytes(32),'hex');
  insert into app.purchase_requests(user_id,place_id,token_hash,expires_at)
    values(auth.uid(),p_place,encode(extensions.digest(v_token,'sha256'),'hex'),v_expires);
  return jsonb_build_object('ok',true,'token',v_token,'place_id',p_place,'expires_at',v_expires,'is_demo',v_place.is_demo);
end $$;

create function public.inspect_purchase_request(p_place uuid,p_token text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r app.purchase_requests%rowtype;
begin
  if not app.is_place_member(p_place) then return app.error_result('forbidden'); end if;
  if p_token is null or p_token !~ '^[0-9a-f]{64}$' then return app.error_result('invalid_qr'); end if;
  select * into r from app.purchase_requests where token_hash=encode(extensions.digest(p_token,'sha256'),'hex') and place_id=p_place;
  if not found then return app.error_result('invalid_qr'); end if;
  if r.consumed_at is not null then return app.error_result('qr_already_used'); end if;
  if r.expires_at<=now() then return app.error_result('qr_expired'); end if;
  return jsonb_build_object('ok',true,'expires_at',r.expires_at);
end $$;

create function app.sync_referral_reward(p_invited uuid) returns void
language plpgsql security definer set search_path='' as $$
declare v_inviter uuid; v_first public.validated_purchases%rowtype; v_month date;
begin
  select inviter_user_id into v_inviter from public.referrals where invited_user_id=p_invited;
  if not found or exists(select 1 from public.point_events where referral_user_id=p_invited and kind='referral' and revoked_at is null) then return; end if;
  select * into v_first from public.validated_purchases where user_id=p_invited and not is_demo and cancelled_at is null order by validated_at,id limit 1;
  if not found then return; end if;
  if exists(select 1 from public.organizer_members m join public.places p on p.organizer_id=m.organizer_id where p.id=v_first.place_id and m.user_id=v_inviter) then return; end if;
  v_month := app.points_month(v_first.validated_at);
  if (select count(*) from public.point_events where user_id=v_inviter and kind='referral' and points_month=v_month and revoked_at is null)>=5 then return; end if;
  insert into public.point_events(user_id,purchase_id,kind,points,referral_user_id,points_month)
    values(v_inviter,v_first.id,'referral',20,p_invited,v_month) on conflict do nothing;
end $$;
revoke all on function app.sync_referral_reward(uuid) from public,anon,authenticated;

create function public.validate_purchase(p_place uuid,p_token text,p_receipt text,p_operation uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  r app.purchase_requests%rowtype; v_place public.places%rowtype; previous public.validated_purchases%rowtype;
  v_receipt text; v_day date; v_night date; v_points integer:=0; v_id uuid;
begin
  if not app.is_place_member(p_place) then return app.error_result('forbidden'); end if;
  if p_token is null or p_token !~ '^[0-9a-f]{64}$' or p_operation is null or p_receipt is null or char_length(btrim(p_receipt)) not between 3 and 80 then
    return app.error_result('invalid_purchase'); end if;
  -- Serializar premios/cupos y anulaciones; evita doble premio bajo llamadas concurrentes.
  perform pg_advisory_xact_lock(764213862);
  select * into v_place from public.places where id=p_place;
  if not v_place.is_active and not v_place.is_demo then return app.error_result('place_unavailable'); end if;
  v_receipt := encode(extensions.digest(lower(btrim(p_receipt)),'sha256'),'hex');
  select * into r from app.purchase_requests where token_hash=encode(extensions.digest(p_token,'sha256'),'hex') and place_id=p_place for update;
  if not found then return app.error_result('invalid_qr'); end if;
  select * into previous from public.validated_purchases where operation_id=p_operation;
  if found then
    if previous.place_id<>p_place or previous.request_id<>r.id or previous.validated_by is distinct from auth.uid() or previous.receipt_hash<>v_receipt then return app.error_result('operation_conflict'); end if;
    return jsonb_build_object('ok',true,'purchase_id',previous.id,'purchase_points',coalesce((select sum(points) from public.point_events where purchase_id=previous.id and user_id=previous.user_id and kind='purchase' and revoked_at is null),0),'is_demo',previous.is_demo,'cancelled',previous.cancelled_at is not null);
  end if;
  if r.consumed_at is not null then return app.error_result('qr_already_used'); end if;
  if r.expires_at<=now() then return app.error_result('qr_expired'); end if;
  if not v_place.is_demo and exists(select 1 from public.organizer_members where user_id=r.user_id and organizer_id=v_place.organizer_id) then return app.error_result('staff_cannot_earn'); end if;
  if v_place.is_demo and r.user_id<>v_place.demo_owner_id then return app.error_result('invalid_qr'); end if;
  select (now() at time zone c.timezone)::date,app.night_date(now(),c.timezone) into v_day,v_night from public.cities c where c.id=v_place.city_id;
  if exists(select 1 from public.validated_purchases where place_id=p_place and receipt_day=v_day and receipt_hash=v_receipt) then return app.error_result('receipt_already_used'); end if;
  insert into public.validated_purchases(request_id,user_id,place_id,validated_by,business_night,receipt_day,receipt_hash,operation_id,is_demo)
    values(r.id,r.user_id,p_place,auth.uid(),v_night,v_day,v_receipt,p_operation,v_place.is_demo) returning id into v_id;
  update app.purchase_requests set consumed_at=now() where id=r.id;
  if not v_place.is_demo
    and not exists(select 1 from public.point_events e join public.validated_purchases p on p.id=e.purchase_id where e.user_id=r.user_id and e.kind='purchase' and e.revoked_at is null and p.place_id=p_place and p.business_night=v_night)
    and (select count(*) from public.point_events e join public.validated_purchases p on p.id=e.purchase_id where e.user_id=r.user_id and e.kind='purchase' and e.revoked_at is null and p.business_night=v_night)<3 then
    v_points:=10;
    insert into public.point_events(user_id,purchase_id,kind,points,points_month) values(r.user_id,v_id,'purchase',10,app.points_month(now()));
  end if;
  if not v_place.is_demo then perform app.sync_referral_reward(r.user_id); end if;
  return jsonb_build_object('ok',true,'purchase_id',v_id,'purchase_points',v_points,'is_demo',v_place.is_demo,'cancelled',false);
end $$;

create function public.cancel_validated_purchase(p_purchase uuid,p_reason text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare p public.validated_purchases%rowtype;
begin
  perform pg_advisory_xact_lock(764213862);
  select * into p from public.validated_purchases where id=p_purchase for update;
  if not found or not app.is_place_member(p.place_id) then return app.error_result('forbidden'); end if;
  if p.cancelled_at is not null then return jsonb_build_object('ok',true); end if;
  if p_reason is null or char_length(btrim(p_reason)) not between 5 and 200 then return app.error_result('invalid_cancellation'); end if;
  update public.validated_purchases set cancelled_at=now(),cancelled_by=auth.uid(),cancellation_reason=btrim(p_reason) where id=p.id;
  update public.point_events set revoked_at=now() where purchase_id=p.id and revoked_at is null;
  if not p.is_demo then perform app.sync_referral_reward(p.user_id); end if;
  return jsonb_build_object('ok',true);
end $$;

create function public.claim_referral(p_code text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_target uuid;
begin
  if auth.uid() is null then return app.error_result('forbidden'); end if;
  perform pg_advisory_xact_lock(764213862);
  if not exists(select 1 from public.profiles where id=auth.uid() and birthdate<=current_date-interval '18 years') then return app.error_result('profile_required'); end if;
  if not app.register_attempt(auth.uid(),'referral_claim',now()) then return app.error_result('rate_limited'); end if;
  if exists(select 1 from public.referrals where invited_user_id=auth.uid()) then return app.error_result('referral_already_set'); end if;
  if exists(select 1 from public.validated_purchases where user_id=auth.uid() and not is_demo) then return app.error_result('already_purchased'); end if;
  select id into v_target from public.profiles where friend_code=lower(btrim(p_code)) and birthdate<=current_date-interval '18 years';
  if v_target is null or v_target=auth.uid() then return app.error_result('invalid_referral_code'); end if;
  if exists(with recursive ancestors(id) as (select v_target union select r.inviter_user_id from public.referrals r join ancestors a on r.invited_user_id=a.id) select 1 from ancestors where id=auth.uid()) then return app.error_result('referral_cycle'); end if;
  insert into public.referrals(invited_user_id,inviter_user_id) values(auth.uid(),v_target);
  return jsonb_build_object('ok',true);
end $$;

create function public.my_referrals() returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object('code',p.friend_code,'has_inviter',exists(select 1 from public.referrals where invited_user_id=auth.uid()),
    'can_claim',not exists(select 1 from public.referrals where invited_user_id=auth.uid()) and not exists(select 1 from public.validated_purchases where user_id=auth.uid() and not is_demo),
    'invited_count',(select count(*) from public.referrals where inviter_user_id=auth.uid()),
    'rewarded_count',(select count(*) from public.point_events where user_id=auth.uid() and kind='referral' and revoked_at is null),
    'monthly_referral_points',coalesce((select sum(points) from public.point_events where user_id=auth.uid() and kind='referral' and points_month=app.points_month(now()) and revoked_at is null),0),
    'rules',app.points_rules()) from public.profiles p where p.id=auth.uid()
$$;

create function public.my_purchase_history() returns jsonb language sql stable security definer set search_path='' as $$
  select coalesce(jsonb_agg(row_data order by at desc),'[]'::jsonb) from (
    select p.validated_at at,jsonb_build_object('id',p.id,'place_name',v.name,'validated_at',p.validated_at,'is_demo',p.is_demo,'cancelled',p.cancelled_at is not null,
      'points',coalesce((select sum(points) from public.point_events where purchase_id=p.id and user_id=auth.uid() and kind='purchase' and revoked_at is null),0)) row_data
    from public.validated_purchases p join public.places v on v.id=p.place_id where p.user_id=auth.uid() order by p.validated_at desc limit 50
  ) history
$$;
create function public.place_purchase_history(p_place uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
  if not app.is_place_member(p_place) then return null; end if;
  return (select coalesce(jsonb_agg(row_data order by at desc),'[]'::jsonb) from (
    select p.validated_at at,jsonb_build_object('id',p.id,'validated_at',p.validated_at,'is_demo',p.is_demo,'cancelled',p.cancelled_at is not null,
      'cancellation_reason',p.cancellation_reason) row_data from public.validated_purchases p where place_id=p_place order by validated_at desc limit 50
  ) history);
end $$;

create function public.set_ranking_participation(p_alias text,p_participating boolean) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null or not exists(select 1 from public.profiles where id=auth.uid() and birthdate<=current_date-interval '18 years') then return app.error_result('profile_required'); end if;
  if p_participating is null then return app.error_result('invalid_alias'); end if;
  if not p_participating then update public.ranking_profiles set participating=false where user_id=auth.uid(); return jsonb_build_object('ok',true); end if;
  if p_alias is null or char_length(btrim(p_alias)) not between 3 and 24 or btrim(p_alias) !~ '^[[:alnum:] _-]+$' then return app.error_result('invalid_alias'); end if;
  insert into public.ranking_profiles(user_id,alias,participating) values(auth.uid(),btrim(p_alias),true)
    on conflict(user_id) do update set alias=excluded.alias,participating=true;
  return jsonb_build_object('ok',true);
exception when unique_violation then return app.error_result('alias_taken');
end $$;

create function public.monthly_ranking(p_month date default null) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare v_month date:=coalesce(p_month,app.points_month(now())); v_me jsonb; v_entries jsonb; v_alias text; v_participating boolean;
begin
  if extract(day from v_month)<>1 or v_month>app.points_month(now()) or v_month<(app.points_month(now())-interval '12 months')::date then return null; end if;
  select alias,participating into v_alias,v_participating from public.ranking_profiles where user_id=auth.uid();
  with totals as (select user_id,sum(points)::int total from public.point_events where points_month=v_month and revoked_at is null group by user_id),
  ranked as (select r.user_id,r.alias,t.total,dense_rank() over(order by t.total desc)::int position from totals t join public.ranking_profiles r on r.user_id=t.user_id where r.participating)
  select coalesce(jsonb_agg(jsonb_build_object('alias',alias,'points',total,'position',position) order by position,alias),'[]'::jsonb) into v_entries from (select * from ranked order by position,alias limit 50) top;
  select jsonb_build_object('points',coalesce(sum(points),0),'purchase_points',coalesce(sum(points) filter(where kind='purchase'),0),'referral_points',coalesce(sum(points) filter(where kind='referral'),0)) into v_me
    from public.point_events where user_id=auth.uid() and points_month=v_month and revoked_at is null;
  return jsonb_build_object('month',v_month,'entries',v_entries,'me',v_me || jsonb_build_object('alias',v_alias,'participating',coalesce(v_participating,false)), 'rules',app.points_rules());
end $$;

-- Congelar el histórico al migrar: nuevas visitas/valoraciones no lo incrementan.
create table app.legacy_reward_totals (
  user_id uuid primary key references auth.users(id) on delete cascade,
  points bigint not null
);
revoke all on app.legacy_reward_totals from public, anon, authenticated;
insert into app.legacy_reward_totals(user_id,points)
  select p.id,(select count(*)*10 from public.checkins where user_id=p.id and geo_ok and not flagged)
    +(select count(*)*5 from public.place_reviews where user_id=p.id) from public.profiles p;

create or replace function public.my_pilot_profile() returns jsonb
language sql stable security definer set search_path='' as $$
  select jsonb_build_object('name',p.display_name,'home_city',p.home_city,'age',extract(year from age(current_date,p.birthdate))::int,
    'contact',coalesce(nullif(u.email,''),u.phone,''),'friend_code',p.friend_code,
    'signups',(select count(*) from public.signups where user_id=p.id and cancelled_at is null),
    'checkins',(select count(*) from public.checkins where user_id=p.id),'reviews',(select count(*) from public.place_reviews where user_id=p.id),
    'points',coalesce((select sum(points) from public.point_events where user_id=p.id and revoked_at is null),0),
    'legacy_points',coalesce((select points from app.legacy_reward_totals where user_id=p.id),0))
  from public.profiles p join auth.users u on u.id=p.id where p.id=auth.uid()
$$;

-- Se retira la red social también de la API, sin destruir sus datos históricos.
revoke all on public.friend_requests from authenticated;
revoke all on function public.my_friends(), public.request_friend(text), public.respond_friend(uuid,boolean) from public,anon,authenticated;
revoke all on function public.purchase_venues(), public.create_purchase_request(uuid), public.inspect_purchase_request(uuid,text),
  public.validate_purchase(uuid,text,text,uuid), public.cancel_validated_purchase(uuid,text),public.claim_referral(text),public.my_referrals(),
  public.my_purchase_history(),public.place_purchase_history(uuid),public.set_ranking_participation(text,boolean),public.monthly_ranking(date)
  from public,anon;
grant execute on function public.purchase_venues(), public.create_purchase_request(uuid), public.inspect_purchase_request(uuid,text),
  public.validate_purchase(uuid,text,text,uuid), public.cancel_validated_purchase(uuid,text),public.claim_referral(text),public.my_referrals(),
  public.my_purchase_history(),public.place_purchase_history(uuid),public.set_ranking_participation(text,boolean),public.monthly_ranking(date)
  to authenticated;
