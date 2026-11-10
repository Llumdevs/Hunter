-- Fotos de los locales: las sube su propio personal, confirmando que tiene derechos sobre ellas.
-- Ficheros en Storage (bucket público: son fotos de escaparate); metadatos y consentimiento en place_photos.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('place-photos', 'place-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

create table public.place_photos (
  id                uuid primary key default gen_random_uuid(),
  place_id          uuid not null references public.places (id) on delete cascade,
  storage_path      text not null unique,
  rights_confirmed  boolean not null check (rights_confirmed),
  uploaded_by       uuid not null default auth.uid() references auth.users (id),
  created_at        timestamptz not null default now()
);
create index on public.place_photos (place_id, created_at);

-- La carpeta de primer nivel del fichero es el id del local. Comprueba el formato antes de convertir,
-- para que un nombre arbitrario se rechace por permisos y no con un error de conversión.
create function app.is_place_folder_member(p_object_name text) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare
  v_folder text := (storage.foldername(p_object_name))[1];
begin
  if v_folder is null or v_folder !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  return app.is_place_member(v_folder::uuid);
end $$;

revoke all on function app.is_place_folder_member(text) from public, anon;
grant execute on function app.is_place_folder_member(text) to authenticated;

create policy place_photos_staff_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'place-photos' and (select app.is_place_folder_member(name)));
-- La API de Storage lee el objeto antes de borrarlo: el personal necesita verlo en su carpeta.
create policy place_photos_staff_select on storage.objects for select to authenticated
  using (bucket_id = 'place-photos' and (select app.is_place_folder_member(name)));
create policy place_photos_staff_delete on storage.objects for delete to authenticated
  using (bucket_id = 'place-photos' and (select app.is_place_folder_member(name)));

alter table public.place_photos enable row level security;
grant select on public.place_photos to anon, authenticated;
grant insert (place_id, storage_path, rights_confirmed), delete on public.place_photos to authenticated;

create policy place_photos_read on public.place_photos for select
  using (exists (select 1 from public.places p where p.id = place_id));
create policy place_photos_staff_insert on public.place_photos for insert to authenticated
  with check ((select app.is_place_member(place_id)) and uploaded_by = (select auth.uid()));
create policy place_photos_staff_delete on public.place_photos for delete to authenticated
  using ((select app.is_place_member(place_id)));
