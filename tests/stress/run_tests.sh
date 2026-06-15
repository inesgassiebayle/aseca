#!/usr/bin/env bash
# run_tests.sh — Stress / Load test con perfiles de recursos Docker.
#
# Uso:
#   ./run_tests.sh <mode> [profile]
#
#   mode:    load | stress
#   profile: none (default) | low | mid | high | all
#
#     none  → sin override, Docker usa todos los recursos disponibles
#     low   → API 0.25 CPU / 256 MB  | DB 0.25 CPU / 128 MB
#     mid   → API 0.50 CPU / 512 MB  | DB 0.50 CPU / 256 MB
#     high  → API 1.00 CPU /   1 GB  | DB 0.50 CPU / 512 MB
#     all   → corre stress en los cuatro perfiles en secuencia
#
# Ejemplos:
#   ./run_tests.sh stress           # stress con recursos ilimitados
#   ./run_tests.sh stress low       # stress con perfil LOW
#   ./run_tests.sh stress all       # stress en los 4 perfiles, un reporte por cada uno
#   ./run_tests.sh load             # load test con recursos ilimitados
#   ./run_tests.sh load mid         # load test con perfil MID

set -euo pipefail

MODE="${1:-}"
PROFILE="${2:-none}"
HOST="${LOCUST_HOST:-http://localhost:8000}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# ── Validaciones ──────────────────────────────────────────────────────────────

if [[ "$MODE" != "load" && "$MODE" != "stress" ]]; then
    echo "ERROR: mode debe ser 'load' o 'stress'."
    echo "Uso: $0 <load|stress> [none|low|mid|high|all]"
    exit 1
fi

VALID_PROFILES=("none" "low" "mid" "high" "all")
if [[ ! " ${VALID_PROFILES[*]} " =~ " $PROFILE " ]]; then
    echo "ERROR: profile debe ser none | low | mid | high | all."
    exit 1
fi

if [[ "$PROFILE" == "all" && "$MODE" != "stress" ]]; then
    echo "ERROR: el perfil 'all' solo aplica al modo stress."
    exit 1
fi

# ── Función principal: una corrida ────────────────────────────────────────────

run_once() {
    local profile="$1"

    # Resolver override file y label
    local override_file=""
    local label=""
    case "$profile" in
        none) label="NONE (sin límites)" ;;
        low)  override_file="docker-compose.constrained-low.yml"
              label="LOW  (API 0.25 CPU / 256 MB | DB 0.25 CPU / 128 MB)" ;;
        mid)  override_file="docker-compose.constrained-mid.yml"
              label="MID  (API 0.50 CPU / 512 MB | DB 0.50 CPU / 256 MB)" ;;
        high) override_file="docker-compose.constrained-high.yml"
              label="HIGH (API 1.00 CPU /   1 GB | DB 0.50 CPU / 512 MB)" ;;
    esac

    local compose_args="-f docker-compose.yml"
    if [[ -n "$override_file" ]]; then
        compose_args="$compose_args -f $override_file"
    fi

    echo ""
    echo "============================================================"
    echo "  Zest Performance Tests"
    echo "  Modo      : $MODE"
    echo "  Recursos  : $label"
    echo "  Host      : $HOST"
    echo "============================================================"
    echo ""

    # Levantar Docker
    echo "[1/3] Levantando Docker (api + db) con perfil $profile..."
    cd "$PROJECT_ROOT"
    docker compose $compose_args up -d --build api db

    # Esperar API
    echo "[2/3] Esperando que la API responda..."
    local retries=0
    until curl -sf "$HOST/health" > /dev/null 2>&1 || curl -sf "$HOST/docs" > /dev/null 2>&1; do
        sleep 2
        retries=$((retries + 1))
        if [[ $retries -ge 30 ]]; then
            echo "ERROR: la API no respondió después de 60s. Abortando."
            exit 1
        fi
        echo "      ... esperando API (${retries}/30)"
    done
    echo "      API lista."

    # Preparar directorio de reporte
    local timestamp
    timestamp="$(date +%Y%m%d_%H%M%S)"
    local report_dir="$SCRIPT_DIR/reports/${timestamp}_${MODE}_${profile}"
    mkdir -p "$report_dir"

    # Correr Locust
    echo "[3/3] Iniciando Locust ($MODE / $profile)..."
    echo ""

    if [[ "$MODE" == "load" ]]; then
        TEST_MODE=load locust \
            --headless \
            -u 50 \
            -r 5 \
            --run-time 10m \
            -f "$SCRIPT_DIR/locustfile.py" \
            --host "$HOST" \
            --csv "$report_dir/results" \
            --html "$report_dir/report.html"
    else
        TEST_MODE=stress locust \
            --headless \
            -f "$SCRIPT_DIR/locustfile.py" \
            --host "$HOST" \
            --csv "$report_dir/results" \
            --html "$report_dir/report.html"
    fi

    echo ""
    echo "  Reporte : $report_dir/report.html"
    echo "  CSV     : $report_dir/results_*.csv"
    echo "============================================================"
    echo ""

    # Bajar Docker entre corridas para limpiar estado
    echo "  Deteniendo contenedores antes de la próxima corrida..."
    docker compose $compose_args down
}

# ── Dispatch ──────────────────────────────────────────────────────────────────

if [[ "$PROFILE" == "all" ]]; then
    echo ""
    echo "  Modo ALL: corriendo stress en perfiles: none → low → mid → high"
    echo "  Reportes en: tests/stress/reports/"
    echo ""
    for p in none low mid high; do
        run_once "$p"
        echo "  Pausa de 10s entre corridas..."
        sleep 10
    done
    echo ""
    echo "  Todas las corridas completadas."
    echo "  Comparar reportes en: $SCRIPT_DIR/reports/"
else
    run_once "$PROFILE"
fi
