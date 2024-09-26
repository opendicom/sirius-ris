#!/bin/sh
set -e

# ------------------------------------------------------------------------------------- #
# Set default values if they are not established in docker-compose.env:
# ------------------------------------------------------------------------------------- #
# TIMEZONE:
export TZ=${TZ:-'America/Argentina/Buenos_Aires'}

# JWT SECRET:
export AUTH_JWT_SECRET=${AUTH_JWT_SECRET:-'top_secret'}

# SSL CERTIFICATES (Only if SIRIUS_BACKEND_HTTPS_ENABLED is true):
export SSL_KEY=${SSL_KEY:-'./certificates/cert.key'}
export SSL_CERT=${SSL_CERT:-'./certificates/cert.crt'}
export SSL_CA=${SSL_CA:-'false'}

# CORS:
export CORS_ENABLED=${CORS_ENABLED:-'false'}
export CORS_WHITELIST=${CORS_WHITELIST:-'["http://cors_ws_client_01.com:8080","https://cors_ws_client_02.com:443"]'}

# IP SERVER:
export IP_SERVER=${IP_SERVER:-'localhost'}

# SIRIUS FRONTEND:
export SIRIUS_FRONTEND_HTTP_PORT=${SIRIUS_FRONTEND_HTTP_PORT:-'4000'}

# PACS:
export PACS_HOST=${PACS_HOST:-'opendicom_pacs'}
export PACS_PORT_MLLP=${PACS_PORT_MLLP:-'2575'}

# WEZEN:
export WEZEN_HOST=${WEZEN_HOST:-'opendicom_wezen'}
export WEZEN_PORT=${WEZEN_PORT:-'2001'}

# SIRIUS BACKEND DB:
export SIRIUS_BACKEND_DB_HOST=${SIRIUS_BACKEND_DB_HOST:-'opendicom_sirius_database'}
export SIRIUS_BACKEND_DB_PORT=${SIRIUS_BACKEND_DB_PORT:-'27017'}
export MONGO_INITDB_ROOT_USERNAME=${MONGO_INITDB_ROOT_USERNAME:-'sirius_user'}
export MONGO_INITDB_ROOT_PASSWORD=${MONGO_INITDB_ROOT_PASSWORD:-'sirius_pass'}
export MONGO_INITDB_DATABASE=${MONGO_INITDB_DATABASE:-'sirius_db'}

# SIRIUS BACKEND REST SERVER:
export SIRIUS_BACKEND_HOST=${SIRIUS_BACKEND_HOST:-'localhost'}
export SIRIUS_BACKEND_HTTP_ENABLED=${SIRIUS_BACKEND_HTTP_ENABLED:-'true'}
export SIRIUS_BACKEND_HTTP_PORT=${SIRIUS_BACKEND_HTTP_PORT:-'2000'}
export SIRIUS_BACKEND_HTTPS_ENABLED=${SIRIUS_BACKEND_HTTPS_ENABLED:-'false'}
export SIRIUS_BACKEND_HTTPS_PORT=${SIRIUS_BACKEND_HTTPS_PORT:-'2003'}

# SIRIUS BACKEND MAIL SERVER:
# Allowed mail types: 'gmail', 'other'.
export SIRIUS_BACKEND_MAIL_TYPE=${SIRIUS_BACKEND_MAIL_TYPE:-'gmail'}
export SIRIUS_BACKEND_MAIL_HOST=${SIRIUS_BACKEND_MAIL_HOST:-'localhost'}
export SIRIUS_BACKEND_MAIL_PORT=${SIRIUS_BACKEND_MAIL_PORT:-'1025'}
export SIRIUS_BACKEND_MAIL_SECURE=${SIRIUS_BACKEND_MAIL_SECURE:-'true'}
export SIRIUS_BACKEND_MAIL_FROM=${SIRIUS_BACKEND_MAIL_FROM:-'opendicom Sirius RIS'}
export SIRIUS_BACKEND_MAIL_USER=${SIRIUS_BACKEND_MAIL_USER:-'opendicomsirius@gmail.com'}
export SIRIUS_BACKEND_MAIL_PASS=${SIRIUS_BACKEND_MAIL_PASS:-'zuuczgrmpesuqlgh'}

# SIRIUS BACKEND LOG LEVEL:
# DEBUG > INFO > WARN > ERROR
export SIRIUS_BACKEND_LOG_LEVEL=${SIRIUS_BACKEND_LOG_LEVEL:-'DEBUG'}

# SIRIUS BACKEND DELETE AUTHORIZATION CODE:
export SIRIUS_BACKEND_DELETE_CODE=${SIRIUS_BACKEND_DELETE_CODE:-'delete_code'}

# SIRIUS BACKEND RABC EXCLUDE CODE:
export SIRIUS_BACKEND_RABC_EXCLUDE_CODE=${SIRIUS_BACKEND_RABC_EXCLUDE_CODE:-'exclude_code'}

# SIRIUS BACKEND ACCESS CONTROL LIMITS:
# Maximum number (AC_NUMBER_OF_ATTEMPTS) of requests that a client IP can make in AC_TIME_WINDOW time.
# If a client IP exceeds this condition it will be penalized for AC_PENALTY_TIME time.
export SIRIUS_BACKEND_AC_NUMBER_OF_ATTEMPTS=${SIRIUS_BACKEND_AC_NUMBER_OF_ATTEMPTS:-'5'}
export SIRIUS_BACKEND_AC_TIME_WINDOW=${SIRIUS_BACKEND_AC_TIME_WINDOW:-'10'}   # Seconds
export SIRIUS_BACKEND_AC_PENALTY_TIME=${SIRIUS_BACKEND_AC_PENALTY_TIME:-'15'} # Seconds

# SIRIUS BACKEND SIGNATURE LENGTH:
# Used in signature PDF service.
export SIRIUS_BACKEND_SIGNATURE_LENGTH=${SIRIUS_BACKEND_SIGNATURE_LENGTH:-'4628'}

# SIRIUS BACKEND LANGUAJE:
export SIRIUS_BACKEND_LANGUAJE=${SIRIUS_BACKEND_LANGUAJE:-'ES'}
# ------------------------------------------------------------------------------------- #

# Create main settings file based on template with environment variables:
find "./" -follow -type f -name "main.settings.template" -print | while read -r template; do
   envsubst < "$template" > main.settings.yaml
done

# Execute app:
npm start