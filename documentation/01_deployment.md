# Deployment

**Sirius RIS** is fully dockerized and its images are publicly accessible in [DockerHub](https://hub.docker.com/search?q=opendicom%2Fsirius).

In order to correctly deploy **Sirius RIS** with **docker**, you must have a dump with the initial database or restore a previous installation.

Within this repository, there is an [**entrypoint.dump**](../service_sirius_db/dumps/entrypoint.dump) with the following credentials:

* <small>**Document:**</small> `1231230`
* <small>**Password:**</small> `opendicom`



> **Note:**
>
> The database restore process is established according to the official documentation of the **mongodb** images in docker.



---



## Docker compose file

##### `Default content of docker-compose.yml file:`

```yaml
version: "3.5"
services:
  opendicom_sirius_db:
    container_name: opendicom_sirius_db
    image: mongo:latest
    env_file: ./docker-compose.env
    volumes:
      - ./service_sirius_db/mongorestore.sh:/docker-entrypoint-initdb.d/mongorestore.sh
      - ./service_sirius_db/dumps:/dumps
      - ./service_sirius_db/data:/data/db
    ports:
      - 27017:27017
    restart: unless-stopped
    networks:
      - opendicom_net

  opendicom_sirius_backend:
    container_name: opendicom_sirius_backend
    image: opendicom/sirius-backend:latest
    env_file: ./docker-compose.env
    ports:
      - 2000:2000
    depends_on:
      - opendicom_sirius_db
    restart: unless-stopped
    networks:
      - opendicom_net

  opendicom_sirius_frontend:
    container_name: opendicom_sirius_frontend
    image: opendicom/sirius-frontend:latest
    env_file: ./docker-compose.env
    ports:
      - 4000:80
    depends_on:
      - opendicom_sirius_backend
    restart: unless-stopped
    networks:
      - opendicom_net

networks:
  opendicom_net:
    name: opendicom_net

```



### Enviroments

##### `Default content of docker-compose.env file (optional):`

```bash
# ------------------------------------------------------------------------------------- #
# ALL:
# ------------------------------------------------------------------------------------- #
# TIMEZONE:
TZ='America/Argentina/Buenos_Aires'

# IP SERVER:
IP_SERVER='localhost'

# JWT SECRET:
AUTH_JWT_SECRET='top_secret'

# SSL CERTIFICATES (Only if SIRIUS_BACKEND_HTTPS_ENABLED is true):
SSL_KEY='./certificates/cert.key'
SSL_CERT='./certificates/cert.crt'
SL_CA=false

# CORS:
CORS_ENABLED=false
CORS_WHITELIST='["http://cors_ws_client_01.com:8080","https://cors_ws_client_02.com:443"]'
# ------------------------------------------------------------------------------------- #


# ------------------------------------------------------------------------------------- #
# PACS:
# ------------------------------------------------------------------------------------- #
PACS_HOST='opendicom_pacs'
PACS_PORT_MLLP=2575
# ------------------------------------------------------------------------------------- #


# ------------------------------------------------------------------------------------- #
# WEZEN:
# ------------------------------------------------------------------------------------- #
WEZEN_HOST='opendicom_wezen'
WEZEN_PORT=8000
# ------------------------------------------------------------------------------------- #


# ------------------------------------------------------------------------------------- #
# SIRIUS DATABASE:
# ------------------------------------------------------------------------------------- #
MONGO_INITDB_ROOT_USERNAME='sirius_user'
MONGO_INITDB_ROOT_PASSWORD='sirius_pass'
MONGO_INITDB_DATABASE='sirius_db'
# ------------------------------------------------------------------------------------- #


# ------------------------------------------------------------------------------------- #
# SIRIUS BACKEND:
# ------------------------------------------------------------------------------------- #
# SIRIUS BACKEND DB:
SIRIUS_BACKEND_DB_HOST='opendicom_sirius_db'
SIRIUS_BACKEND_DB_PORT=27017

# SIRIUS BACKEND REST SERVER:
SIRIUS_BACKEND_HOST='localhost'
SIRIUS_BACKEND_HTTP_ENABLED=true
SIRIUS_BACKEND_HTTP_PORT=2000
SIRIUS_BACKEND_HTTPS_ENABLED=false
SIRIUS_BACKEND_HTTPS_PORT=2001

# SIRIUS BACKEND MAIL SERVER:
# Allowed mail types: 'gmail', 'other'.
SIRIUS_BACKEND_MAIL_TYPE='gmail'
SIRIUS_BACKEND_MAIL_HOST='localhost'
SIRIUS_BACKEND_MAIL_PORT=1025
SIRIUS_BACKEND_MAIL_SECURE=true
SIRIUS_BACKEND_MAIL_FROM='opendicom Sirius RIS'
SIRIUS_BACKEND_MAIL_USER='mail_user@gmail.com'
SIRIUS_BACKEND_MAIL_PASS='password'

# SIRIUS BACKEND LOG LEVEL:
# DEBUG > INFO > WARN > ERROR
SIRIUS_BACKEND_LOG_LEVEL='DEBUG'

# SIRIUS BACKEND DELETE AUTHORIZATION CODE:
SIRIUS_BACKEND_DELETE_CODE='delete_code'

# SIRIUS BACKEND RABC EXCLUDE CODE:
SIRIUS_BACKEND_RABC_EXCLUDE_CODE='exclude_code'

# SIRIUS BACKEND ACCESS CONTROL LIMITS:
# Maximum number (AC_NUMBER_OF_ATTEMPTS) of requests that a client IP can make in AC_TIME_WINDOW time.
# If a client IP exceeds this condition it will be penalized for AC_PENALTY_TIME time.
SIRIUS_BACKEND_AC_NUMBER_OF_ATTEMPTS=5
SIRIUS_BACKEND_AC_TIME_WINDOW=10    # Seconds 
SIRIUS_BACKEND_AC_PENALTY_TIME=15   # Seconds 

# SIRIUS BACKEND LANGUAJE:
SIRIUS_BACKEND_LANGUAJE='ES'
# ------------------------------------------------------------------------------------- #


# ------------------------------------------------------------------------------------- #
# SIRIUS FRONTEND:
# ------------------------------------------------------------------------------------- #
# Pager defaults:
SIRIUS_FRONTEND_DEFAULT_PAGE_SIZES='[10, 25, 50, 100]'
SIRIUS_FRONTEND_CHECK_IN_DEFAULT_SIZE=1000

# Localization:
SIRIUS_FRONTEND_DEFAULT_COUNTRY='858'
SIRIUS_FRONTEND_DEFAULT_ISOCODE='UY'
SIRIUS_FRONTEND_DEFAULT_COUNTRY_NAME='Uruguay'
SIRIUS_FRONTEND_DEFAULT_STATE_ISOCODE='MO'
SIRIUS_FRONTEND_DEFAULT_STATE_NAME='Montevideo'
SIRIUS_FRONTEND_DEFAULT_CITY_NAME='Montevideo'
SIRIUS_FRONTEND_DEFAULT_DOC_TYPE='1'
SIRIUS_FRONTEND_DEFAULT_UTC='UTC-3' #To Fix Mongoose Timestamps in Pipes.

# Default FullCalendar configuration:
# SIRIUS_FRONTEND_FC_INITIALVIEW: resourceTimeGridDay | resourceTimeGridWeek
SIRIUS_FRONTEND_FC_INITIALVIEW='resourceTimeGridWeek'
SIRIUS_FRONTEND_FC_SLOTMINTIME='08:00:00'
SIRIUS_FRONTEND_FC_SLOTMAXTIME='18:00:00'
SIRIUS_FRONTEND_FC_SLOTDURATION='00:10:00'

# Patient password keywords:
SIRIUS_FRONTEND_PASS_KEYWORDS='["cat", "dog", "bird", "pig", "lion", "cow", "chicken", "fish", "monkey"]'
# ------------------------------------------------------------------------------------- #
```
