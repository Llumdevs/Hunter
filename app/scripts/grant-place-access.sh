#!/usr/bin/env bash
# SOLO desarrollo local: da acceso al panel de un organizador a un usuario ya registrado.
# Uso: npm run db:grant-staff -- <email> [organizer_id]   (por defecto, el organizador de demostración)
set -euo pipefail
cd "$(dirname "$0")/.."
email="${1:?Indica el email del usuario}"
organizer="${2:-20000000-0000-0000-0000-0000000000d1}"
project_id=$(sed -n 's/^project_id = "\(.*\)"/\1/p' supabase/config.toml)
docker exec -i "supabase_db_${project_id}" psql -q -v ON_ERROR_STOP=1 -U postgres -d postgres \
  -v email="$email" -v organizer="$organizer" <<'SQL'
insert into public.organizer_members (organizer_id, user_id, role)
select :'organizer'::uuid, u.id, 'owner' from auth.users u where u.email = :'email'
on conflict do nothing
returning 'acceso concedido' as resultado;
SQL
