begin;
\ir helpers.psql
select plan(5);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000f1', 'nuevo@test.local'),
  ('00000000-0000-0000-0000-0000000000f2', 'otro@test.local');

select pg_temp.login_as('00000000-0000-0000-0000-0000000000f1');
select throws_ok($$ insert into public.profiles (id, display_name, birthdate)
  values ('00000000-0000-0000-0000-0000000000f2', 'Suplantador', '2000-01-01') $$,
  '42501', null, 'no se puede crear el perfil de otro usuario');
select throws_ok($$ insert into public.profiles (id, display_name, birthdate)
  values ('00000000-0000-0000-0000-0000000000f1', 'Menor', current_date - interval '17 years') $$,
  '42501', null, 'un menor no puede darse de alta');
select throws_ok($$ insert into public.profiles (id, display_name, birthdate)
  values ('00000000-0000-0000-0000-0000000000f1', '   ', '2000-01-01') $$,
  '23514', null, 'el nombre no puede estar vacío');
select lives_ok($$ insert into public.profiles (id, display_name, birthdate)
  values ('00000000-0000-0000-0000-0000000000f1', 'Nuevo', '2000-01-01') $$,
  'un adulto crea su propio perfil');
select throws_ok($$ update public.profiles set birthdate = '2015-01-01' $$,
  '42501', null, 'la fecha de nacimiento no se puede cambiar después');
reset role;

select * from finish();
rollback;
