#!/bin/sh
set -e

export SIRIUS_FRONTEND_HOST=${SIRIUS_FRONTEND_HOST:-opendicom_sirius_frontend}
export SIRIUS_FRONTEND_PORT=${SIRIUS_FRONTEND_PORT:-4000}

#find "/template" -follow -type f -name "*.template" -print -exit | while read -r template; do
#    envsubst < "$template" > /app/main.settings.yaml
#done

exec "$@"