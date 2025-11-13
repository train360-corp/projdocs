#!/usr/bin/env bash

set -euo pipefail

# ============================================================
# Colors (disable by exporting NO_COLOR=1)
# ============================================================
if [[ "${NO_COLOR:-0}" == "1" ]]; then
  COLOR_RESET="" COLOR_INFO="" COLOR_WARN="" COLOR_ERROR="" COLOR_DEBUG=""
else
  COLOR_RESET="\033[0m"
  COLOR_INFO="\033[1;34m"
  COLOR_WARN="\033[1;33m"
  COLOR_ERROR="\033[1;31m"
  COLOR_DEBUG="\033[1;35m"
fi

# ============================================================
# Logging
# ============================================================

_debug() {  # Only prints if DEBUG=1
  if [[ "${DEBUG:-0}" == "1" ]]; then
    echo -e "${COLOR_DEBUG}[DEBUG]${COLOR_RESET} $*"
  fi
}

_info() {
  echo -e "${COLOR_INFO}[ INFO] ${COLOR_RESET} $*"
}

_warn() {
  echo -e "${COLOR_WARN}[ WARN] ${COLOR_RESET} $*" >&2
}

_error() {
  echo -e "${COLOR_ERROR}[ERROR]${COLOR_RESET} $*" >&2
}

_fatal() {
  echo -e "${COLOR_ERROR}[FATAL]${COLOR_RESET} $*" >&2
  exit 1
}

# ============================================================
# Utils
# ============================================================

_require() {
  local cmd="$1"
  local msg="${2:-}"

  if ! command -v "$cmd" >/dev/null 2>&1; then
    if [[ -n "$msg" ]]; then
      _fatal "$msg"
    else
      _fatal "required command '$cmd' not found in PATH"
    fi
  else
    _debug "found required command: $cmd"
  fi
}

# ============================================================
# Header
# ============================================================
_printHeader() {
cat <<'EOF'

  ░█████████               ░█░███████
  ░██     ░██                ░██   ░██
  ░██     ░█░██░███░███████░█░██    ░██░███████ ░███████ ░███████
  ░█████████░███  ░██    ░█░█░██    ░█░██    ░█░██    ░█░██
  ░██       ░██   ░██    ░█░█░██    ░█░██    ░█░██       ░███████
  ░██       ░██   ░██    ░█░█░██   ░██░██    ░█░██    ░██      ░██
  ░██       ░██    ░███████░█░███████  ░███████ ░███████ ░███████
                           ░██
                         ░███

  ProjDocs Installer
  Copyright © Train360, Corp. 2025

EOF
}

# ============================================================
# OS-Specific Install Logic
# ============================================================
_install() {
  case "$(uname -s)" in
    Linux)
      _debug "detected os: Linux"
      _fatal "not implemented"
      ;;
    Darwin)
      _debug "detected os: macOS"
      _require docker "install docker to continue: https://docs.docker.com/desktop/setup/install/mac-install/"


      _fatal "implementation not completed"
      ;;
    CYGWIN*|MINGW*|MSYS*)
      _debug "Detected Windows (POSIX environment)"
      _fatal "not implemented"
      ;;
    *)
      _fatal "detected os: $(uname -s)"
      ;;
  esac
}

# ============================================================
# Main
# ============================================================
_main() {
  clear || true
  _debug "entering _main"
  _printHeader
  _install
  _debug "done"
}

_main