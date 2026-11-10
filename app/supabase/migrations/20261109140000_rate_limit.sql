-- Límite de intentos por usuario en check-in y canje.
-- Las funciones públicas devuelven el error como resultado (jsonb) en vez de lanzarlo:
-- si lanzaran, el ROLLBACK borraría también el registro del intento y los fallos no contarían.
-- Resultado: {"ok": true, "checkin" | "redemption": {...}} o {"ok": false, "error": "<código>"}.

create table app.rate_limit_events (
  id          bigint generated always as identity primary key,
  user_id     uuid not null,
  action      text not null check (action in ('check_in', 'redeem')),
  created_at  timestamptz not null
);
create index on app.rate_limit_events (user_id, action, created_at);
revoke all on app.rate_limit_events from public, anon, authenticated;

insert into app.config (key, value) values
  ('rate_limit_max_attempts', '10'),
  ('rate_limit_window_min', '10'),
  ('rate_limit_retention_hours', '24');

-- Registra el intento si cabe en la ventana. Devuelve false (sin registrar) si se ha superado el límite.
create function app.register_attempt(p_user_id uuid, p_action text, p_now timestamptz) returns boolean
language plpgsql as $$
begin
  if (select count(*) from app.rate_limit_events
      where user_id = p_user_id and action = p_action
        and created_at > p_now - make_interval(mins => app.config_int('rate_limit_window_min')))
     >= app.config_int('rate_limit_max_attempts') then
    return false;
  end if;
  insert into app.rate_limit_events (user_id, action, created_at) values (p_user_id, p_action, p_now);
  return true;
end $$;

create function app.error_result(p_code text) returns jsonb
language sql immutable as $$ select jsonb_build_object('ok', false, 'error', p_code) $$;

create function app.check_in_attempt(
  p_user_id uuid, p_place_id uuid, p_static_token text, p_screen_code text,
  p_lat double precision, p_lng double precision, p_now timestamptz)
returns jsonb
language plpgsql as $$
begin
  if not app.register_attempt(p_user_id, 'check_in', p_now) then
    return app.error_result('rate_limited');
  end if;
  -- Bloque interior: si falla, solo se deshace el check-in; el intento registrado se conserva.
  begin
    return jsonb_build_object('ok', true, 'checkin',
      to_jsonb(app.check_in_at(p_user_id, p_place_id, p_static_token, p_screen_code, p_lat, p_lng, p_now)));
  exception when sqlstate 'P0001' then
    return app.error_result(sqlerrm);
  end;
end $$;

create function app.redeem_attempt(p_user_id uuid, p_checkin_id uuid, p_offer_id uuid, p_now timestamptz)
returns jsonb
language plpgsql as $$
begin
  if not app.register_attempt(p_user_id, 'redeem', p_now) then
    return app.error_result('rate_limited');
  end if;
  begin
    return jsonb_build_object('ok', true, 'redemption',
      to_jsonb(app.redeem_at(p_user_id, p_checkin_id, p_offer_id, p_now)));
  exception when sqlstate 'P0001' then
    return app.error_result(sqlerrm);
  end;
end $$;

create function app.purge_rate_limit_events(p_now timestamptz) returns integer
language sql as $$
  with purged as (
    delete from app.rate_limit_events
    where created_at < p_now - make_interval(hours => app.config_int('rate_limit_retention_hours'))
    returning 1
  )
  select count(*)::integer from purged
$$;

create or replace function app.purge_personal_data() returns void
language plpgsql as $$
begin
  perform app.purge_checkin_locations(now());
  perform app.purge_rate_limit_events(now());
end $$;

-- Las funciones públicas pasan a devolver jsonb.
drop function public.check_in(uuid, text, text, double precision, double precision);
drop function public.redeem(uuid, uuid);

-- Credencial: p_static_token o p_screen_code. Ubicación: p_lat y p_lng, o ninguna.
create function public.check_in(
  p_place_id uuid, p_static_token text default null, p_screen_code text default null,
  p_lat double precision default null, p_lng double precision default null)
returns jsonb
language sql security definer set search_path = '' as $$
  select app.check_in_attempt((select auth.uid()), p_place_id, p_static_token, p_screen_code,
                              p_lat, p_lng, now())
$$;

create function public.redeem(p_checkin_id uuid, p_offer_id uuid)
returns jsonb
language sql security definer set search_path = '' as $$
  select app.redeem_attempt((select auth.uid()), p_checkin_id, p_offer_id, now())
$$;

revoke all on function app.register_attempt(uuid, text, timestamptz) from public, anon, authenticated;
revoke all on function app.error_result(text) from public, anon, authenticated;
revoke all on function app.check_in_attempt(uuid, uuid, text, text, double precision, double precision, timestamptz)
  from public, anon, authenticated;
revoke all on function app.redeem_attempt(uuid, uuid, uuid, timestamptz) from public, anon, authenticated;
revoke all on function app.purge_rate_limit_events(timestamptz) from public, anon, authenticated;
revoke all on function public.check_in(uuid, text, text, double precision, double precision) from public, anon;
revoke all on function public.redeem(uuid, uuid) from public, anon;
grant execute on function public.check_in(uuid, text, text, double precision, double precision) to authenticated;
grant execute on function public.redeem(uuid, uuid) to authenticated;
