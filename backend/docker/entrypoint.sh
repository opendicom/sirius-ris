#!/bin/sh
set -e

export SIRIUS_BACKEND_HOST=${SIRIUS_BACKEND_HOST:-opendicom_sirius_backend}
export SIRIUS_BACKEND_PORT=${SIRIUS_BACKEND_PORT:-3000}

#find "/template" -follow -type f -name "*.template" -print -exit | while read -r template; do
#    envsubst < "$template" > /app/main.settings.yaml
#done

exec "$@"