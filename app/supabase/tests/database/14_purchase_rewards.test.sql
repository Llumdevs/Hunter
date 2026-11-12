begin;
\ir helpers.psql
select plan(55);
select pg_temp.seed();
-- Fixture privilegiada solo dentro de esta transacción: ejecuta ambos lados del flujo.
create function pg_temp.buy(p_customer uuid,p_place uuid,p_staff uuid,p_receipt text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare original text:=current_setting('request.jwt.claims',true); token text; result jsonb;
begin
  perform set_config('request.jwt.claims',jsonb_build_object('sub',p_customer,'role','authenticated')::text,true);
  token:=public.create_purchase_request(p_place)->>'token';
  perform set_config('request.jwt.claims',jsonb_build_object('sub',p_staff,'role','authenticated')::text,true);
  result:=public.validate_purchase(p_place,token,p_receipt,gen_random_uuid());
  perform set_config('request.jwt.claims',coalesce(original,'{}'),true);
  return result;
end $$;
select set_config('test.place','30000000-0000-0000-0000-000000000001',true);
select set_config('test.customer','00000000-0000-0000-0000-00000000000a',true);
select set_config('test.inviter','00000000-0000-0000-0000-00000000000b',true);
select set_config('test.staff','00000000-0000-0000-0000-00000000000d',true);
select set_config('test.code_a',(select friend_code from public.profiles where id=current_setting('test.customer')::uuid),true);
select set_config('test.code_b',(select friend_code from public.profiles where id=current_setting('test.inviter')::uuid),true);
select pg_temp.login_anon();
select throws_ok($$ select public.create_purchase_request(current_setting('test.place')::uuid) $$,'42501',null,'no hay QR sin sesión');
reset role;
select pg_temp.login_as(current_setting('test.customer')::uuid);
select throws_ok('select * from public.point_events','42501',null,'los puntos no se leen o escriben por tablas');
select throws_ok('select * from app.purchase_requests','42501',null,'los tokens permanecen privados');
select is(public.claim_referral(current_setting('test.code_a'))->>'error','invalid_referral_code','no hay auto-invitaciones');
select is(public.claim_referral(current_setting('test.code_b'))->>'ok','true','se vincula un código antes de comprar');
select is(public.claim_referral(current_setting('test.code_b'))->>'error','referral_already_set','no se cambia de padrino ni se repite la invitación');
select is((public.my_referrals() ? 'friends'),false,'las invitaciones no exponen una red social');
reset role;
select pg_temp.login_as(current_setting('test.inviter')::uuid);
select is(public.claim_referral(current_setting('test.code_a'))->>'error','referral_cycle','se rechazan invitaciones circulares');
reset role;
select pg_temp.login_as(current_setting('test.customer')::uuid);
select set_config('test.old_token',public.create_purchase_request(current_setting('test.place')::uuid)->>'token',true);
select set_config('test.token',public.create_purchase_request(current_setting('test.place')::uuid)->>'token',true);
select is(public.inspect_purchase_request(current_setting('test.place')::uuid,current_setting('test.token'))->>'error','forbidden','el cliente no valida su propia compra');
reset role;
select pg_temp.login_as(current_setting('test.staff')::uuid);
select is(public.inspect_purchase_request(current_setting('test.place')::uuid,current_setting('test.old_token'))->>'error','qr_expired','renovar el QR invalida el anterior');
select is(public.inspect_purchase_request(current_setting('test.place')::uuid,current_setting('test.token'))->>'ok','true','el personal comprueba un QR válido');
select is(public.inspect_purchase_request('30000000-0000-0000-0000-000000000002',current_setting('test.token'))->>'error','invalid_qr','el QR está vinculado a un único local');
select is(public.inspect_purchase_request(current_setting('test.place')::uuid,current_setting('test.token')) ? 'user_id',false,'la comprobación no revela el perfil del cliente');
select is(public.create_purchase_request(current_setting('test.place')::uuid)->>'error','staff_cannot_earn','el personal no genera compras puntuables de su propio local');
select set_config('test.operation',gen_random_uuid()::text,true);
select set_config('test.purchase',public.validate_purchase(current_setting('test.place')::uuid,current_setting('test.token'),'TICKET-1',current_setting('test.operation')::uuid)->>'purchase_id',true);
select is(public.validate_purchase(current_setting('test.place')::uuid,current_setting('test.token'),'TICKET-1',current_setting('test.operation')::uuid)->>'purchase_id',current_setting('test.purchase'),'el reintento de red es idempotente');
select is(public.validate_purchase(current_setting('test.place')::uuid,current_setting('test.token'),'TICKET-2',current_setting('test.operation')::uuid)->>'error','operation_conflict','una operación no cambia de ticket');
select is(public.validate_purchase(current_setting('test.place')::uuid,current_setting('test.token'),'TICKET-2',gen_random_uuid())->>'error','qr_already_used','un QR no registra dos compras');
reset role;
select pg_temp.login_as(current_setting('test.customer')::uuid);
select is((public.my_pilot_profile()->>'points')::int,10,'una compra validada suma 10 puntos');
select is((public.my_purchase_history()->0->>'points')::int,10,'el cliente ve sus puntos y el historial');
select is(jsonb_array_length(public.monthly_ranking()->'entries'),0,'no se publica a nadie por defecto');
select is(public.set_ranking_participation('LuzPiloto',true)->>'ok','true','el cliente opta voluntariamente por un alias');
select is(jsonb_array_length(public.monthly_ranking()->'entries'),1,'el participante aparece en el ranking');
select is(jsonb_path_exists(public.monthly_ranking(),'$.entries[*].user_id'),false,'el ranking no expone identificadores');
select is(public.monthly_ranking()->'rules'->'prize'->>'title','Dos entradas a una experiencia cultural · Ejemplo','el premio es explícitamente ficticio');
reset role;
select pg_temp.login_as(current_setting('test.inviter')::uuid);
select is((public.my_referrals()->>'monthly_referral_points')::int,20,'la primera compra del invitado premia al padrino');
select is(public.set_ranking_participation('luzpiloto',true)->>'error','alias_taken','no se suplanta un alias con otra capitalización');
select is(public.set_ranking_participation('correo@example.com',true)->>'error','invalid_alias','no se aceptan emails como alias');
reset role;
select set_config('test.second_purchase',pg_temp.buy(current_setting('test.customer')::uuid,current_setting('test.place')::uuid,current_setting('test.staff')::uuid,'ticket-2')->>'purchase_id',true);
select is((select count(*)::int from public.point_events where user_id=current_setting('test.customer')::uuid and kind='purchase' and revoked_at is null),1,'una segunda compra en el mismo local y noche no suma');
select is((select count(*)::int from public.point_events where user_id=current_setting('test.inviter')::uuid and kind='referral' and revoked_at is null),1,'no se duplica el premio de invitación');
select pg_temp.login_as(current_setting('test.customer')::uuid);
select set_config('test.token',public.create_purchase_request(current_setting('test.place')::uuid)->>'token',true);
select is(public.cancel_validated_purchase(current_setting('test.purchase')::uuid,'Error de prueba')->>'error','forbidden','un cliente no anula operaciones del personal');
reset role;
select pg_temp.login_as(current_setting('test.staff')::uuid);
select is(public.validate_purchase(current_setting('test.place')::uuid,current_setting('test.token'),' ticket-1 ',gen_random_uuid())->>'error','receipt_already_used','el ticket no se duplica con espacios o mayúsculas');
select is(public.cancel_validated_purchase(current_setting('test.purchase')::uuid,'Pago registrado por error')->>'ok','true','el personal puede anular');
select is(public.cancel_validated_purchase(current_setting('test.purchase')::uuid,'Pago registrado por error')->>'ok','true','anular dos veces es idempotente');
select is(public.validate_purchase(current_setting('test.place')::uuid,current_setting('test.token'),'ticket-1',gen_random_uuid())->>'error','receipt_already_used','anular no permite reutilizar el mismo ticket');
select is(public.validate_purchase(current_setting('test.place')::uuid,current_setting('test.old_token'),'TICKET-1',current_setting('test.operation')::uuid)->>'error','operation_conflict','el identificador de operación tampoco acepta otro QR');
reset role;
select is((select count(*)::int from public.point_events where purchase_id=current_setting('test.purchase')::uuid and revoked_at is null),0,'se revocan todos los premios de la operación anulada');
select is((select purchase_id from public.point_events where referral_user_id=current_setting('test.customer')::uuid and kind='referral' and revoked_at is null),current_setting('test.second_purchase')::uuid,'el premio de invitación pasa a la primera compra válida restante');
select pg_temp.login_as(current_setting('test.staff')::uuid);
select is(public.cancel_validated_purchase(current_setting('test.second_purchase')::uuid,'Anulación de segunda compra')->>'ok','true','también se puede anular la segunda');
reset role;
select pg_temp.login_as(current_setting('test.inviter')::uuid);
select is((public.my_referrals()->>'monthly_referral_points')::int,0,'sin compras válidas desaparece el premio de invitación');
reset role;
select pg_temp.login_as(current_setting('test.customer')::uuid);
select is((public.my_pilot_profile()->>'points')::int,0,'no quedan puntos de compras anuladas');
select set_config('test.expired_token',public.create_purchase_request(current_setting('test.place')::uuid)->>'token',true);
reset role;
update app.purchase_requests set expires_at=now()-interval '1 second' where token_hash=encode(extensions.digest(current_setting('test.expired_token'),'sha256'),'hex');
select pg_temp.login_as(current_setting('test.staff')::uuid);
select is(public.validate_purchase(current_setting('test.place')::uuid,current_setting('test.expired_token'),'expired',gen_random_uuid())->>'error','qr_expired','un QR caducado no permite validar');
reset role;

-- Cuatro locales, un máximo de tres puntuables por noche. No se usa el importe ni el tipo de bebida.
insert into public.places(id,city_id,organizer_id,kind,slug,name,zone,address,location,is_active)
select ('31000000-0000-0000-0000-'||lpad(i::text,12,'0'))::uuid,'10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',
 'bar','purchase-test-'||i,'Compra '||i,'Ruzafa','Prueba 1',extensions.st_makepoint(-0.37,39.46)::extensions.geography,true from generate_series(1,4)i;
select pg_temp.buy(current_setting('test.inviter')::uuid,('31000000-0000-0000-0000-'||lpad(i::text,12,'0'))::uuid,current_setting('test.staff')::uuid,'cap-'||i) from generate_series(1,4)i;
select is((select sum(points)::int from public.point_events where user_id=current_setting('test.inviter')::uuid and kind='purchase' and revoked_at is null),30,'máximo 30 puntos por tres locales en una noche');
select pg_temp.login_as(current_setting('test.inviter')::uuid);
select is(public.claim_referral(current_setting('test.code_a'))->>'error','already_purchased','no se vincula una invitación después de comprar');
reset role;

-- Demo: mismo flujo con permisos reales, sin puntos ni ranking.
select pg_temp.login_as(current_setting('test.customer')::uuid);
select set_config('test.demo',public.create_my_demo_venue()->>'place_id',true);
reset role;
select is(pg_temp.buy(current_setting('test.customer')::uuid,current_setting('test.demo')::uuid,current_setting('test.customer')::uuid,'demo-1')->>'is_demo','true','el propietario puede ensayar ambos lados en su demo');
select is((select count(*)::int from public.point_events e join public.validated_purchases p on p.id=e.purchase_id where p.is_demo),0,'la demo nunca crea puntos reales');
select pg_temp.login_as(current_setting('test.inviter')::uuid);
select is(public.inspect_purchase_request(current_setting('test.demo')::uuid,repeat('a',64))->>'error','forbidden','otro usuario no valida el demo ajeno');
reset role;

-- Límite mensual de invitaciones y protección frente al borrado o la anulación del premio.
select pg_temp.create_user('00000000-0000-0000-0000-00000000000e','referrer','1990-01-01');
select set_config('test.code_e',(select friend_code from public.profiles where id='00000000-0000-0000-0000-00000000000e'),true);
do $$ declare original text:=current_setting('request.jwt.claims'); u uuid; result jsonb;
begin for i in 1..6 loop
 u:=('00000000-0000-0000-0010-'||lpad(i::text,12,'0'))::uuid;
 perform pg_temp.create_user(u,'invited-'||i,'2000-01-01');
 perform set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated')::text,true);
 perform public.claim_referral(current_setting('test.code_e'));
 result:=pg_temp.buy(u,current_setting('test.place')::uuid,current_setting('test.staff')::uuid,'referral-'||i);
 if result->>'ok'<>'true' then raise exception 'Fixture purchase failed: %',result; end if;
end loop; perform set_config('request.jwt.claims',original,true); end $$;
select is((select sum(points)::int from public.point_events where user_id='00000000-0000-0000-0000-00000000000e' and kind='referral' and revoked_at is null),100,'máximo cinco invitaciones premiadas al mes');
select is((select count(*)::int from public.referrals where inviter_user_id='00000000-0000-0000-0000-00000000000e'),6,'se cuentan las invitaciones aunque se alcance el límite de premios');
select pg_temp.login_as('00000000-0000-0000-0000-00000000000e');
select is(public.set_ranking_participation('PilotoMensual',true)->>'ok','true','el padrino también puede participar por alias');
select is((public.monthly_ranking()->'me'->>'points')::int,100,'el contador mensual usa el registro del servidor');
select is(public.monthly_ranking((date_trunc('month',now() at time zone 'Europe/Madrid')+interval '1 month')::date),null::jsonb,'no hay ranking futuro');
reset role;
select is(app.points_month('2026-10-31 23:30:00+00'),'2026-11-01'::date,'el cambio de mes usa Europe/Madrid y no UTC');
select pg_temp.login_as('00000000-0000-0000-0000-00000000000e');
select is(public.set_ranking_participation('',false)->>'ok','true','es posible salir del ranking sin perder puntos');
select is(jsonb_path_exists(public.monthly_ranking(),'$.entries[*] ? (@.alias == "PilotoMensual")'),false,'salir oculta el alias de la clasificación');
reset role;
select is((select count(*)::int from app.platform_admins),0,'no se ha configurado ningún administrador');
select * from finish();
rollback;
