-- Piloto: perfil privado, feedback, amigos por código y valoraciones de visitas verificadas.
alter table public.profiles add column home_city text check (char_length(home_city) between 1 and 80);
alter table public.profiles add column friend_code text not null default encode(extensions.gen_random_bytes(8), 'hex') unique;
alter table app.rate_limit_events drop constraint rate_limit_events_action_check;
alter table app.rate_limit_events add constraint rate_limit_events_action_check check (action in ('check_in', 'redeem', 'friend_request'));

create table public.pilot_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  message text not null check (char_length(btrim(message)) between 10 and 2000),
  created_at timestamptz not null default now()
);
create table public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  check (requester_id <> recipient_id)
);
create unique index friend_pair_unique on public.friend_requests (least(requester_id, recipient_id), greatest(requester_id, recipient_id));
create table public.place_reviews (
  checkin_id uuid primary key references public.checkins(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  place_id uuid not null references public.places(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text not null default '' check (char_length(comment) <= 500),
  created_at timestamptz not null default now()
);
create index reviews_place on public.place_reviews(place_id);
create index feedback_user on public.pilot_feedback(user_id, created_at);
create index friends_recipient on public.friend_requests(recipient_id);
create index reviews_user on public.place_reviews(user_id);

alter table public.pilot_feedback enable row level security;
alter table public.friend_requests enable row level security;
alter table public.place_reviews enable row level security;
revoke all on public.pilot_feedback, public.friend_requests, public.place_reviews from anon, authenticated;
grant select on public.pilot_feedback, public.friend_requests, public.place_reviews to authenticated;
create policy feedback_own_read on public.pilot_feedback for select to authenticated using (user_id = (select auth.uid()));
create policy friends_participant_read on public.friend_requests for select to authenticated using ((select auth.uid()) in (requester_id, recipient_id));
create policy reviews_own_read on public.place_reviews for select to authenticated using (user_id = (select auth.uid()));

create function public.my_pilot_profile() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('name', p.display_name, 'home_city', p.home_city,
    'age', extract(year from age(current_date, p.birthdate))::int,
    'contact', coalesce(u.email, u.phone, ''), 'friend_code', p.friend_code,
    'signups', (select count(*) from public.signups s where s.user_id = p.id and s.cancelled_at is null),
    'checkins', (select count(*) from public.checkins c where c.user_id = p.id),
    'reviews', (select count(*) from public.place_reviews r where r.user_id = p.id),
    'points', (select count(*) * 10 from public.checkins c where c.user_id = p.id and c.geo_ok and not c.flagged)
            + (select count(*) * 5 from public.place_reviews r where r.user_id = p.id))
  from public.profiles p join auth.users u on u.id = p.id where p.id = (select auth.uid())
$$;

create function public.update_my_city(p_city text) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then return app.error_result('forbidden'); end if;
  if p_city is not null and char_length(btrim(p_city)) > 80 then return app.error_result('invalid_city'); end if;
  update public.profiles set home_city = nullif(btrim(p_city), '') where id = auth.uid();
  if not found then return app.error_result('profile_required'); end if;
  return jsonb_build_object('ok', true);
end $$;

create function public.send_pilot_feedback(p_message text) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then return app.error_result('forbidden'); end if;
  perform 1 from public.profiles where id = auth.uid() for update;
  if not found then return app.error_result('profile_required'); end if;
  if p_message is null or char_length(btrim(p_message)) not between 10 and 2000 then return app.error_result('invalid_feedback'); end if;
  if (select count(*) from public.pilot_feedback where user_id = auth.uid() and created_at > now() - interval '1 day') >= 5 then
    return app.error_result('rate_limited');
  end if;
  insert into public.pilot_feedback(message) values (btrim(p_message));
  return jsonb_build_object('ok', true);
end $$;

create function public.my_friends() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', f.id, 'name', p.display_name,
    'status', f.status, 'incoming', f.recipient_id = auth.uid()) order by f.created_at desc), '[]'::jsonb)
  from public.friend_requests f join public.profiles p
    on p.id = case when f.requester_id = auth.uid() then f.recipient_id else f.requester_id end
  where auth.uid() in (f.requester_id, f.recipient_id)
$$;

create function public.request_friend(p_code text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare target_id uuid;
begin
  if auth.uid() is null then return app.error_result('forbidden'); end if;
  perform 1 from public.profiles where id = auth.uid() for update;
  if not found then return app.error_result('profile_required'); end if;
  if (select count(*) from app.rate_limit_events where user_id = auth.uid() and action = 'friend_request' and created_at > now() - interval '1 day') >= 20 then
    return app.error_result('rate_limited');
  end if;
  -- Registrar también intentos inválidos; cancelar una solicitud no reinicia el límite.
  insert into app.rate_limit_events(user_id, action, created_at) values (auth.uid(), 'friend_request', now());
  select id into target_id from public.profiles where friend_code = lower(btrim(p_code));
  if target_id is null or target_id = auth.uid() then return app.error_result('invalid_friend_code'); end if;
  insert into public.friend_requests(requester_id, recipient_id) values (auth.uid(), target_id) on conflict do nothing;
  if not found then return app.error_result('already_requested'); end if;
  return jsonb_build_object('ok', true);
end $$;

create function public.respond_friend(p_request uuid, p_accept boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then return app.error_result('forbidden'); end if;
  if p_accept then
    update public.friend_requests set status = 'accepted'
      where id = p_request and recipient_id = auth.uid() and status = 'pending';
  else
    delete from public.friend_requests where id = p_request and auth.uid() in (requester_id, recipient_id);
  end if;
  if not found then return app.error_result('request_not_found'); end if;
  return jsonb_build_object('ok', true);
end $$;

create function public.review_visit(p_checkin uuid, p_rating integer, p_comment text default '') returns jsonb
language plpgsql security definer set search_path = '' as $$
declare visit public.checkins%rowtype;
begin
  if auth.uid() is null then return app.error_result('forbidden'); end if;
  if p_rating is null or p_rating not between 1 and 5 or p_comment is null or char_length(p_comment) > 500 then return app.error_result('invalid_review'); end if;
  select * into visit from public.checkins where id = p_checkin and user_id = auth.uid() and geo_ok and not flagged and created_at <= now();
  if not found then return app.error_result('verified_visit_required'); end if;
  insert into public.place_reviews(checkin_id, place_id, rating, comment)
    values (visit.id, visit.place_id, p_rating, btrim(p_comment)) on conflict do nothing;
  if not found then return app.error_result('already_reviewed'); end if;
  return jsonb_build_object('ok', true);
end $$;

create function public.place_rating_summary(p_place uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('count', count(*), 'average', case when count(*) >= 3 then round(avg(rating), 1) end)
  from public.place_reviews where place_id = p_place
$$;

revoke all on function public.my_pilot_profile(), public.update_my_city(text), public.send_pilot_feedback(text),
  public.my_friends(), public.request_friend(text), public.respond_friend(uuid, boolean), public.review_visit(uuid, integer, text), public.place_rating_summary(uuid)
  from public, anon;
grant execute on function public.my_pilot_profile(), public.update_my_city(text), public.send_pilot_feedback(text),
  public.my_friends(), public.request_friend(text), public.respond_friend(uuid, boolean), public.review_visit(uuid, integer, text), public.place_rating_summary(uuid)
  to authenticated;

create function public.my_reviewable_visits() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'place_name', p.name,
    'night_date', c.night_date, 'rating', r.rating) order by c.created_at desc), '[]'::jsonb)
  from public.checkins c join public.places p on p.id = c.place_id
  left join public.place_reviews r on r.checkin_id = c.id
  where c.user_id = auth.uid() and c.geo_ok and not c.flagged and c.created_at <= now()
$$;
revoke all on function public.my_reviewable_visits() from public, anon;
grant execute on function public.my_reviewable_visits() to authenticated;
