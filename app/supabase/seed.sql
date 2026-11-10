-- Datos de demostración SOLO para desarrollo local (npm run db:reset). Nunca en producción.
-- Local abierto todos los días las 24 h, para poder probar el flujo a cualquier hora:
--   http://127.0.0.1:3000/c/30000000-0000-0000-0000-0000000000d1?k=demo-token-0123456789abcdef

insert into public.cities (id, name, timezone)
values ('10000000-0000-0000-0000-0000000000d1', 'Valencia', 'Europe/Madrid');

insert into public.organizers (id, kind, name)
values ('20000000-0000-0000-0000-0000000000d1', 'venue_owner', 'Demo Ruzafa SL');

insert into public.places (id, city_id, organizer_id, kind, slug, name, zone, address, location, is_active, is_founder)
values ('30000000-0000-0000-0000-0000000000d1', '10000000-0000-0000-0000-0000000000d1',
        '20000000-0000-0000-0000-0000000000d1', 'bar', 'bar-demo', 'Bar Demo', 'Ruzafa',
        'Carrer de Cuba 1, València', extensions.st_makepoint(-0.3730, 39.4620)::extensions.geography, true, true);

-- Apertura y cierre a la misma hora = abierto 24 h (cierra al día siguiente a esa hora).
insert into public.place_opening_hours (place_id, weekday, opens_at, closes_at)
select '30000000-0000-0000-0000-0000000000d1', d, '00:00', '00:00' from generate_series(1, 7) d;

insert into app.place_qr (place_id, static_token, screen_secret)
values ('30000000-0000-0000-0000-0000000000d1', 'demo-token-0123456789abcdef', convert_to('demo-secret', 'UTF8'));

insert into public.offers (id, place_id, title, description, includes_alcohol, days_of_week)
values ('40000000-0000-0000-0000-0000000000d1', '30000000-0000-0000-0000-0000000000d1',
        'Tapa de bienvenida', 'Una tapa de la casa con tu primera consumición.', false, '{1,2,3,4,5,6,7}');

-- ---------------------------------------------------------------------------------------------
-- Más locales de demostración para «Esta noche» (abiertos 24 h para poder probar a cualquier hora).
-- ---------------------------------------------------------------------------------------------
update public.places set price_level = '€€', base_age_band = '25-30' where id = '30000000-0000-0000-0000-0000000000d1';
insert into public.place_programming (place_id, weekday, music, vibe)
select '30000000-0000-0000-0000-0000000000d1', d, 'indie', 'hablar' from generate_series(1, 7) d;

insert into public.places (id, city_id, organizer_id, kind, slug, name, zone, address, location, is_active, price_level, base_age_band)
values
  ('30000000-0000-0000-0000-0000000000d2', '10000000-0000-0000-0000-0000000000d1', '20000000-0000-0000-0000-0000000000d1',
   'club', 'sala-neon', 'Sala Neón', 'Ruzafa', 'Carrer de Sueca 10, València',
   extensions.st_makepoint(-0.3752, 39.4608)::extensions.geography, true, '€€', '25-30'),
  ('30000000-0000-0000-0000-0000000000d3', '10000000-0000-0000-0000-0000000000d1', '20000000-0000-0000-0000-0000000000d1',
   'bar', 'la-terraza', 'La Terraza', 'El Carmen', 'Carrer de Dalt 5, València',
   extensions.st_makepoint(-0.3801, 39.4790)::extensions.geography, true, '€', '18-24'),
  ('30000000-0000-0000-0000-0000000000d4', '10000000-0000-0000-0000-0000000000d1', '20000000-0000-0000-0000-0000000000d1',
   'directo', 'jazz-cellar', 'Jazz Cellar', 'Cánovas', 'Carrer de Serrano Morales 3, València',
   extensions.st_makepoint(-0.3651, 39.4660)::extensions.geography, true, '€€€', '30-40'),
  ('30000000-0000-0000-0000-0000000000d5', '10000000-0000-0000-0000-0000000000d1', '20000000-0000-0000-0000-0000000000d1',
   'previa', 'el-patio', 'El Patio', 'Benimaclet', 'Carrer de Murta 8, València',
   extensions.st_makepoint(-0.3602, 39.4871)::extensions.geography, true, '€', '18-24');

insert into public.place_opening_hours (place_id, weekday, opens_at, closes_at)
select p, d, '00:00', '00:00'
from unnest(array['30000000-0000-0000-0000-0000000000d2', '30000000-0000-0000-0000-0000000000d3',
                  '30000000-0000-0000-0000-0000000000d4', '30000000-0000-0000-0000-0000000000d5']::uuid[]) p
cross join generate_series(1, 7) d;

insert into public.place_programming (place_id, weekday, music, vibe)
select p.id, d, p.music, p.vibe
from (values ('30000000-0000-0000-0000-0000000000d2'::uuid, 'house', 'bailar'),
             ('30000000-0000-0000-0000-0000000000d3'::uuid, 'reggaeton', 'previa'),
             ('30000000-0000-0000-0000-0000000000d4'::uuid, 'jazz', 'directo'),
             ('30000000-0000-0000-0000-0000000000d5'::uuid, 'pop', 'hablar')) p (id, music, vibe)
cross join generate_series(1, 7) d;

insert into app.place_qr (place_id, static_token, screen_secret)
select p, 'demo-token-' || right(p::text, 2) || '-0123456789abcdef', convert_to('demo-secret-' || right(p::text, 2), 'UTF8')
from unnest(array['30000000-0000-0000-0000-0000000000d2', '30000000-0000-0000-0000-0000000000d3',
                  '30000000-0000-0000-0000-0000000000d4', '30000000-0000-0000-0000-0000000000d5']::uuid[]) p;

insert into public.offers (place_id, title, description, includes_alcohol, days_of_week)
values
  ('30000000-0000-0000-0000-0000000000d2', 'Entrada reducida', 'Entrada a 5 € en vez de 12 € hasta la 01:00.', false, '{4,5,6}'),
  ('30000000-0000-0000-0000-0000000000d3', 'Refresco gratis', 'Con tu primera consumición.', false, '{1,2,3,4,5,6,7}'),
  ('30000000-0000-0000-0000-0000000000d4', 'Mesa garantizada', 'Te guardamos sitio cerca del escenario.', false, '{1,2,3,4,5,6,7}'),
  ('30000000-0000-0000-0000-0000000000d5', 'Patatas bravas', 'Una ración para compartir con tu primera ronda.', false, '{1,2,3,4,5,6,7}');
