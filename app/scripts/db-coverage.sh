#!/usr/bin/env bash
# Cobertura de sentencias y ramas de las funciones PL/pgSQL (plpgsql_check profiler).
# Ejecuta todos los tests pgTAP en una sola sesión con el profiler activo. Uso: npm run db:coverage
# Las funciones LANGUAGE sql no se miden: las cubren los tests de comportamiento y la mutación.
set -euo pipefail
cd "$(dirname "$0")/.."
project_id=$(sed -n 's/^project_id = "\(.*\)"/\1/p' supabase/config.toml)
container="supabase_db_${project_id}"
tests_dir="supabase/tests/database"

docker exec "$container" rm -rf /tmp/coverage-tests
docker cp "$tests_dir" "$container:/tmp/coverage-tests"
{
  echo "create extension if not exists plpgsql_check;"
  echo "set plpgsql_check.profiler = on;"
  echo "\\o /dev/null"
  for test_file in "$tests_dir"/*.test.sql; do
    echo "\\i /tmp/coverage-tests/$(basename "$test_file")"
  done
  echo "\\o"
  cat <<'SQL'
select p.proname as funcion,
       round(100 * plpgsql_coverage_statements(p.oid))::int as "sentencias_%",
       round(100 * plpgsql_coverage_branches(p.oid))::int   as "ramas_%"
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
join pg_language l on l.oid = p.prolang
where n.nspname in ('app', 'public') and l.lanname = 'plpgsql'
order by 2, 1;
drop extension plpgsql_check;
SQL
} | docker exec -i -w /tmp/coverage-tests "$container" psql -q -U postgres -d postgres 2>&1 | grep -v NOTICE
