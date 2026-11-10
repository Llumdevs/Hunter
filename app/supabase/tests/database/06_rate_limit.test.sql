begin;
\ir helpers.psql
select plan(12);
select pg_temp.seed();

create function pg_temp.attempt_check_in(p_token text, p_now timestamptz) returns jsonb language sql as $$
  select app.check_in_attempt('00000000-0000-0000-0000-00000000000a',
    '30000000-0000-0000-0000-000000000001', p_token, null, null, null, p_now)
$$;

-- Los errores se devuelven como resultado y el intento queda registrado.
select is(pg_temp.attempt_check_in('token-falso', pg_temp.friday_night()),
  '{"ok": false, "error": "qr_invalid"}'::jsonb, 'un QR incorrecto devuelve el error sin lanzar excepción');
select is((select count(*)::int from app.rate_limit_events), 1, 'el intento fallido queda registrado');

-- 10 intentos en 10 minutos (configurable); el 11.º se rechaza aunque el QR sea correcto.
select pg_temp.attempt_check_in('token-falso', pg_temp.friday_night() + make_interval(secs => i))
from generate_series(1, 9) i;
select is(pg_temp.attempt_check_in('static-token-1', pg_temp.friday_night() + interval '1 minute'),
  '{"ok": false, "error": "rate_limited"}'::jsonb, 'el 11.º intento en la ventana se rechaza');
select is((select count(*)::int from public.checkins), 0, 'el intento limitado no crea check-in');
select is(app.redeem_attempt('00000000-0000-0000-0000-00000000000a', gen_random_uuid(),
  '40000000-0000-0000-0000-000000000001', pg_temp.friday_night() + interval '1 minute')->>'error', 'checkin_not_found',
  'con el límite de check-in agotado, el canje sigue disponible (contadores separados)');

-- Pasada la ventana, vuelve a funcionar.
create temp table later as
  select pg_temp.attempt_check_in('static-token-1', pg_temp.friday_night() + interval '11 minutes') as r;
select is((select r->>'ok' from later), 'true', 'pasada la ventana se puede volver a intentar');
select is((select (r->'checkin'->>'id')::uuid from later), (select id from public.checkins),
  'el resultado incluye el check-in creado');

-- Cada acción tiene su propio contador.
select is(app.redeem_attempt('00000000-0000-0000-0000-00000000000a', (select id from public.checkins),
  '40000000-0000-0000-0000-000000000001', pg_temp.friday_night() + interval '12 minutes')->>'ok', 'true',
  'los intentos de check-in no consumen el límite de canjes');

-- Canje: los errores también se devuelven como resultado y tienen su propio límite.
select is(app.redeem_attempt('00000000-0000-0000-0000-00000000000b', (select id from public.checkins),
  '40000000-0000-0000-0000-000000000001', pg_temp.friday_night() + interval '12 minutes'),
  '{"ok": false, "error": "checkin_not_found"}'::jsonb, 'un canje inválido devuelve el error sin lanzar excepción');
select app.redeem_attempt('00000000-0000-0000-0000-00000000000b', (select id from public.checkins),
  '40000000-0000-0000-0000-000000000001', pg_temp.friday_night() + interval '12 minutes' + make_interval(secs => i))
from generate_series(1, 9) i;
select is(app.redeem_attempt('00000000-0000-0000-0000-00000000000b', (select id from public.checkins),
  '40000000-0000-0000-0000-000000000001', pg_temp.friday_night() + interval '13 minutes'),
  '{"ok": false, "error": "rate_limited"}'::jsonb, 'el 11.º intento de canje en la ventana se rechaza');

-- Los registros de intentos se borran pasado un día.
select is(app.purge_rate_limit_events(pg_temp.friday_night() + interval '2 days'), 23,
  'se borran los intentos de hace más de un día');
select is((select count(*)::int from app.rate_limit_events), 0, 'no queda ningún intento antiguo');

select * from finish();
rollback;
