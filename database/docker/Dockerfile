# ------------------------------------------------------------------------------------- #
# HOW TO BUILD:
# ------------------------------------------------------------------------------------- #
# Outside Docker Build Context: Build this image from parent directory 'database'.
# Example:
# docker build -t opendicom/sirius-database:1.1.0 -f docker/Dockerfile .
# ------------------------------------------------------------------------------------- #


# ------------------------------------------------------------------------------------- #
# SIRIUS DATABASE STAGE:
# ------------------------------------------------------------------------------------- #
FROM mongo:latest

LABEL version="1.1.0"
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

# Add cron start lines to docker-entrypoint.sh:
RUN sed -i '2i# Start cron\n/usr/sbin/cron\ncrontab /etc/crontab' /usr/local/bin/docker-entrypoint.sh
# ------------------------------------------------------------------------------------- #