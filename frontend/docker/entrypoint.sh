#!/bin/sh
set -e

# ------------------------------------------------------------------------------------- #
# Set default values if they are not established in docker-compose.env:
# ------------------------------------------------------------------------------------- #
# TIMEZONE:
export TZ=${TZ:-'America/Argentina/Buenos_Aires'}

# IP SERVER:
export IP_SERVER=${IP_SERVER:-'localhost'}

# SIRIUS BACKEND REST SERVER:
export SIRIUS_BACKEND_HTTP_PORT=${SIRIUS_BACKEND_HTTP_PORT:-'2000'}

# SIRIUS FRONTEND:
#RABC Exclude code:
export SIRIUS_BACKEND_RABC_EXCLUDE_CODE=${SIRIUS_BACKEND_RABC_EXCLUDE_CODE:-'exclude_code'}

# Pager defaults:
export SIRIUS_FRONTEND_DEFAULT_PAGE_SIZES=${SIRIUS_FRONTEND_DEFAULT_PAGE_SIZES:-'[10, 25, 50, 100]'}
export SIRIUS_FRONTEND_CHECK_IN_DEFAULT_SIZE=${SIRIUS_FRONTEND_CHECK_IN_DEFAULT_SIZE:-'1000'}

# Localization:
export SIRIUS_FRONTEND_DEFAULT_COUNTRY=${SIRIUS_FRONTEND_DEFAULT_COUNTRY:-'858'}
export SIRIUS_FRONTEND_DEFAULT_ISOCODE=${SIRIUS_FRONTEND_DEFAULT_ISOCODE:-'UY'}
export SIRIUS_FRONTEND_DEFAULT_COUNTRY_NAME=${SIRIUS_FRONTEND_DEFAULT_COUNTRY_NAME:-'Uruguay'}
export SIRIUS_FRONTEND_DEFAULT_STATE_ISOCODE=${SIRIUS_FRONTEND_DEFAULT_STATE_ISOCODE:-'MO'}
export SIRIUS_FRONTEND_DEFAULT_STATE_NAME=${SIRIUS_FRONTEND_DEFAULT_STATE_NAME:-'Montevideo'}
export SIRIUS_FRONTEND_DEFAULT_CITY_NAME=${SIRIUS_FRONTEND_DEFAULT_CITY_NAME:-'Montevideo'}
export SIRIUS_FRONTEND_DEFAULT_DOC_TYPE=${SIRIUS_FRONTEND_DEFAULT_DOC_TYPE:-'1'}
export SIRIUS_FRONTEND_DEFAULT_UTC=${SIRIUS_FRONTEND_DEFAULT_UTC:-'UTC-3'}

# Default FullCalendar configuration:
# SIRIUS_FRONTEND_FC_INITIALVIEW: resourceTimeGridDay | resourceTimeGridWeek
export SIRIUS_FRONTEND_FC_INITIALVIEW=${SIRIUS_FRONTEND_FC_INITIALVIEW:-'resourceTimeGridWeek'}
export SIRIUS_FRONTEND_FC_SLOTMINTIME=${SIRIUS_FRONTEND_FC_SLOTMINTIME:-'08:00:00'}
export SIRIUS_FRONTEND_FC_SLOTMAXTIME=${SIRIUS_FRONTEND_FC_SLOTMAXTIME:-'18:00:00'}
export SIRIUS_FRONTEND_FC_SLOTDURATION=${SIRIUS_FRONTEND_FC_SLOTDURATION:-'00:10:00'}

# Patient password keywords:
export SIRIUS_FRONTEND_PASS_KEYWORDS=${SIRIUS_FRONTEND_PASS_KEYWORDS:-'["eucalipto", "roble", "cedro", "romero", "ficus", "cactus", "tacuara", "manzano", "higuera", "carpincho", "mulita", "yacare", "cardenal", "golondrina", "benteveo", "chaja", "jaguar", "dorado"]'}
# ------------------------------------------------------------------------------------- #

# Create main.settings file based on template with environment variables:
find "/docker/" -follow -type f -name "main-settings.template" -print | while read -r template; do
   envsubst < "$template" > /usr/share/nginx/html/assets/main-settings.json
done

exec "$@"