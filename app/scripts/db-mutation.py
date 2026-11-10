#!/usr/bin/env python3
"""Mutación de la lógica SQL: introduce errores plausibles de uno en uno y comprueba que pgTAP los detecta.

Uso: npm run db:mutation   (tarda varios minutos: cada mutante recrea la base de datos)
Las migraciones originales se restauran siempre al terminar, aunque falle.
"""
import os
import shutil
import subprocess
import sys
import tempfile

MIGRATIONS = "supabase/migrations"

CORE, RETENTION, RATE, PANEL, PROFILE = "core_schema", "retention", "rate_limit", "venue_panel", "profile_signup"

# (descripción, fichero de migración, texto original, texto mutado)
MUTANTS = [
    ("canje cobrable sin ubicación", CORE, "v_first and v_checkin.geo_ok", "v_first"),
    ("QR de pantalla acepta 2 pasos atrás", CORE, "app.screen_step(p_now) - 1),", "app.screen_step(p_now) - 2),"),
    ("QR de pantalla acepta 2 pasos adelante", CORE, "app.screen_step(p_now) + 1)))", "app.screen_step(p_now) + 2)))"),
    ("radio 10 veces mayor", CORE, "if v_distance > app.config_int", "if v_distance > 10 * app.config_int"),
    ("cierre inclusivo", CORE, "and p_local < d.day + h.closes_at", "and p_local <= d.day + h.closes_at"),
    ("after no cruza al día siguiente", CORE, "case when h.closes_at <= h.opens_at then interval '1 day'",
     "case when h.closes_at < h.opens_at - interval '12 hours' then interval '1 day'"),
    ("sesión del día anterior ignorada", CORE, "(values (p_local::date), (p_local::date - 1))", "(values (p_local::date))"),
    ("límite de oferta sin cruzar medianoche", CORE, "case when p_until < h.opens_at then interval '1 day'",
     "case when false then interval '1 day'"),
    ("primera visita ignora al usuario", CORE, "where c.user_id = p_user_id and c.place_id = p_place_id)",
     "where c.place_id = p_place_id)"),
    ("mayoría de edad estricta", CORE, "and birthdate <= p_local_date", "and birthdate < p_local_date"),
    ("canje en otra sesión", CORE, "is distinct from v_checkin.night_date", "is not distinct from null"),
    ("RLS de check-ins abierta", CORE, "using (user_id = (select auth.uid()));\ncreate policy redemptions",
     "using (true);\ncreate policy redemptions"),
    ("retención ignorada", RETENTION, "where created_at < p_now - make_interval", "where created_at < p_now + make_interval"),
    ("límite de intentos con >", RATE, ">= app.config_int('rate_limit_max_attempts')", "> app.config_int('rate_limit_max_attempts')"),
    ("ventana de límite sin filtrar acción", RATE, "where user_id = p_user_id and action = p_action", "where user_id = p_user_id"),
    ("nocturno sin purgar intentos", RATE, "  perform app.purge_rate_limit_events(now());\n", ""),
    ("cifras sin comprobar miembro", PANEL, "  perform app.assert_place_member(p_place_id);\n  if p_from > p_to", "  if p_from > p_to"),
    ("cobrables sin filtrar billable", PANEL, "c.night_date = n.night and r.billable)", "c.night_date = n.night)"),
    ("apuntados incluye cancelados", PANEL, " and s.cancelled_at is null", ""),
    ("rango máximo con 1 noche más", PANEL, "p_to - p_from + 1 > app.config_int", "p_to - p_from > app.config_int"),
    ("credenciales de QR revocado", PANEL, "q.place_id = p_place_id and q.revoked_at is null", "q.place_id = p_place_id"),
    ("alta de perfil de menores", PROFILE, "\n    and birthdate <= current_date - make_interval(years => 18)", ""),
]


def run(command: str) -> subprocess.CompletedProcess:
    return subprocess.run(command, shell=True, capture_output=True, text=True)


def migration_path(key: str) -> str:
    return next(os.path.join(MIGRATIONS, name) for name in os.listdir(MIGRATIONS) if key in name)


def mutant_is_killed(key: str, original: str, mutated: str, backup: str) -> bool | None:
    shutil.rmtree(MIGRATIONS)
    shutil.copytree(backup, MIGRATIONS)
    path = migration_path(key)
    source = open(path).read()
    if source.count(original) != 1:
        raise ValueError(f"patrón no único o ausente en {path}: {original!r}")
    open(path, "w").write(source.replace(original, mutated))
    if run("npx supabase db reset").returncode != 0:
        return None
    result = run("npx supabase test db")
    return "Result: FAIL" in result.stdout + result.stderr


def main() -> int:
    os.chdir(os.path.join(os.path.dirname(__file__), ".."))
    backup = os.path.join(tempfile.mkdtemp(prefix="hunter-mutation-"), "migrations")
    shutil.copytree(MIGRATIONS, backup)
    killed = 0
    try:
        for name, key, original, mutated in MUTANTS:
            outcome = mutant_is_killed(key, original, mutated, backup)
            label = {True: "MUERTO   ", False: "SOBREVIVE", None: "NO APLICA"}[outcome]
            killed += outcome is True
            print(f"{label} {name}", flush=True)
    finally:
        shutil.rmtree(MIGRATIONS)
        shutil.copytree(backup, MIGRATIONS)
        run("npx supabase db reset")
    print(f"{killed}/{len(MUTANTS)} mutantes muertos · migraciones originales restauradas")
    return 0 if killed == len(MUTANTS) else 1


if __name__ == "__main__":
    sys.exit(main())
