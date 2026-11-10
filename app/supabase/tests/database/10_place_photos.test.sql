begin;
\ir helpers.psql
select plan(9);
select pg_temp.seed();

select results_eq($$ select public, file_size_limit, allowed_mime_types from storage.buckets where id = 'place-photos' $$,
  $$ values (true, 5242880::bigint, array['image/jpeg', 'image/png', 'image/webp']) $$,
  'bucket público, 5 MB y solo imágenes');

-- Personal del local: sube a la carpeta de su local y registra la foto con la confirmación de derechos.
select pg_temp.login_as('00000000-0000-0000-0000-00000000000d');
select lives_ok($$ insert into storage.objects (bucket_id, name)
  values ('place-photos', '30000000-0000-0000-0000-000000000001/foto-1.jpg') $$,
  'el personal sube a la carpeta de su local');
select lives_ok($$ insert into public.place_photos (place_id, storage_path, rights_confirmed)
  values ('30000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001/foto-1.jpg', true) $$,
  'el personal registra la foto confirmando derechos');
select throws_ok($$ insert into public.place_photos (place_id, storage_path, rights_confirmed)
  values ('30000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001/foto-2.jpg', false) $$,
  '23514', null, 'sin confirmar derechos no se registra');
select is((select uploaded_by from public.place_photos limit 1), '00000000-0000-0000-0000-00000000000d'::uuid,
  'queda constancia de quién la subió');
reset role;

-- Otro usuario
select pg_temp.login_as('00000000-0000-0000-0000-00000000000a');
select throws_ok($$ insert into storage.objects (bucket_id, name)
  values ('place-photos', '30000000-0000-0000-0000-000000000001/intruso.jpg') $$,
  '42501', null, 'quien no es del local no sube fotos');
select throws_ok($$ insert into storage.objects (bucket_id, name) values ('place-photos', 'no-es-un-uuid/x.jpg') $$,
  '42501', null, 'una carpeta que no es un local se rechaza sin error de conversión');
select throws_ok($$ insert into public.place_photos (place_id, storage_path, rights_confirmed)
  values ('30000000-0000-0000-0000-000000000001', 'x.jpg', true) $$,
  '42501', null, 'quien no es del local no registra fotos');
reset role;

select pg_temp.login_anon();
select is((select count(*)::int from public.place_photos), 1, 'cualquiera ve las fotos de un local activo');
reset role;

select * from finish();
rollback;
