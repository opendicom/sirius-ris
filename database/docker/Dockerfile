# ------------------------------------------------------------------------------------- #
# HOW TO BUILD:
# ------------------------------------------------------------------------------------- #
# Outside Docker Build Context: Build this image from parent directory 'database'.
# Example:
# docker build -t opendicom/sirius-database:1.1.2 -f docker/Dockerfile .
# ------------------------------------------------------------------------------------- #


# ------------------------------------------------------------------------------------- #
# SIRIUS DATABASE STAGE:
# ------------------------------------------------------------------------------------- #
FROM mongo:latest

LABEL version="1.1.2"
LABEL maintainer="opendicom <info@opendicom.com>"
LABEL author="Camilo Pifano Herrera <camilopifano@gmail.com>"
LABEL description="Sirius RIS is an open source Radiology Information System"

# Copy mongorestore.sh:
COPY ./docker/mongorestore.sh /docker-entrypoint-initdb.d/mongorestore.sh

# Give mongorestore.sh execute permissions:
RUN chmod +x /docker-entrypoint-initdb.d/mongorestore.sh

# Installation of necessary packages:
RUN apt-get update && apt-get install -y cron
    
# Copy initial cron file:
COPY ./cron/crontab_file /etc/crontab

# Give crontab execute permissions:
RUN chmod -x /etc/crontab

# Create directory for cron scripts:
RUN mkdir /opt/scripts

# Copy backup.sh:
COPY ./docker/backup.sh /opt/scripts/backup.sh

# Give backup.sh execute permissions:
RUN chmod +x /opt/scripts/backup.sh

# Copy pre-entrypoint.sh:
COPY ./docker/pre-entrypoint.sh /usr/local/bin/pre-entrypoint.sh

# Add pre-entrypoint file into docker-entrypoint.sh
RUN { \
    head -n 1 /usr/local/bin/docker-entrypoint.sh; \
    cat /usr/local/bin/pre-entrypoint.sh; \
    tail -n +2 /usr/local/bin/docker-entrypoint.sh; \
} > /usr/local/bin/docker-entrypoint-temp.sh && mv /usr/local/bin/docker-entrypoint-temp.sh /usr/local/bin/docker-entrypoint.sh

# Give docker-entrypoint.sh execute permissions:
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
# ------------------------------------------------------------------------------------- #