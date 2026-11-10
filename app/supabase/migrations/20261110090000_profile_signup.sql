-- Alta de perfil desde la app: cada usuario crea solo el suyo y debe ser mayor de edad.
-- La fecha de nacimiento no se puede modificar después (no hay permiso de UPDATE sobre esa columna).

alter table public.profiles
  add constraint profiles_display_name_length check (char_length(btrim(display_name)) between 1 and 60),
  add constraint profiles_birthdate_range check (birthdate >= date '1900-01-01');

grant insert (id, display_name, birthdate, locale) on public.profiles to authenticated;

create policy profiles_own_insert on public.profiles for insert to authenticated
  with check (
    id = (select auth.uid())
    and birthdate <= current_date - make_interval(years => 18)
  );
