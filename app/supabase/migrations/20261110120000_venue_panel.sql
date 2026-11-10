-- Panel del local: cifras agregadas por noche y credenciales del QR, solo para su personal.
-- El local nunca ve datos individuales: solo recuentos.

insert into app.config (key, value) values ('stats_max_nights', '62');

create function app.assert_place_member(p_place_id uuid) returns void
language plpgsql as $$
begin
  if not app.is_place_member(p_place_id) then
    raise exception using errcode = '42501', message = 'forbidden';
  end if;
end $$;

create function public.place_nightly_stats(p_place_id uuid, p_from date, p_to date)
returns table (night_date date, signups integer, checkins integer, redemptions integer, billable integer)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
begin
  perform app.assert_place_member(p_place_id);
  if p_from > p_to then
    perform app.fail('invalid_range');
  end if;
  if p_to - p_from + 1 > app.config_int('stats_max_nights') then
    perform app.fail('range_too_large');
  end if;

  return query
  select n.night::date,
         (select count(*)::integer from public.signups s
          where s.place_id = p_place_id and s.night_date = n.night and s.cancelled_at is null),
         (select count(*)::integer from public.checkins c
          where c.place_id = p_place_id and c.night_date = n.night),
         (select count(*)::integer from public.redemptions r join public.checkins c on c.id = r.checkin_id
          where c.place_id = p_place_id and c.night_date = n.night),
         (select count(*)::integer from public.redemptions r join public.checkins c on c.id = r.checkin_id
          where c.place_id = p_place_id and c.night_date = n.night and r.billable)
  from generate_series(p_from, p_to, interval '1 day') n (night)
  order by 1;
end $$;

-- Token del QR fijo y secreto del modo pantalla (hex), para que el navegador del local genere los códigos.
create function public.place_qr_credentials(p_place_id uuid)
returns table (static_token text, screen_secret text)
language plpgsql security definer set search_path = '' as $$
begin
  perform app.assert_place_member(p_place_id);
  if not exists (select 1 from app.place_qr q where q.place_id = p_place_id and q.revoked_at is null) then
    perform app.fail('qr_revoked');
  end if;
  return query
  select q.static_token, encode(q.screen_secret, 'hex') from app.place_qr q where q.place_id = p_place_id;
end $$;

revoke all on function app.assert_place_member(uuid) from public, anon, authenticated;
revoke all on function public.place_nightly_stats(uuid, date, date) from public, anon;
revoke all on function public.place_qr_credentials(uuid) from public, anon;
grant execute on function public.place_nightly_stats(uuid, date, date) to authenticated;
grant execute on function public.place_qr_credentials(uuid) to authenticated;
