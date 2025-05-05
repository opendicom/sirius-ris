# ------------------------------------------------------------------------------------- #
# HOW TO BUILD:
# ------------------------------------------------------------------------------------- #
# Outside Docker Build Context: Build this image from parent directory 'frontend'.
# Example:
# docker build -t opendicom/sirius-frontend:1.3.0 -f docker/Dockerfile .
# ------------------------------------------------------------------------------------- #


# ------------------------------------------------------------------------------------- #
# OHIF STAGE (Extract bundles):
# ------------------------------------------------------------------------------------- #
# Set ohif-bundles image:
FROM opendicom/ohif-viewer:3.9 AS ohif-bundles
# ------------------------------------------------------------------------------------- #


# ------------------------------------------------------------------------------------- #
# SIRIUS FRONTEND STAGE:
# ------------------------------------------------------------------------------------- #
# Set frontend-builder image:
FROM node:18 AS frontend-builder

# Install gettext-base (envsubst):
RUN apt-get update && apt-get -y install gettext-base

# Install angular cli and devkit frontend-builder (Global dev dependencies):
RUN npm install -g @angular/cli@13.1.2
RUN npm install -g @angular-devkit/build-angular@13.1.2

# Set workdir:
WORKDIR /app

# Copy src:
COPY ../ .

# Install dependencies using legacy-peer-deps to match your local environment setup:
# The 'npm ci' command is optimized for continuous integration (CI) environments,
# as it performs a faster and more deterministic installation.
RUN npm ci --legacy-peer-deps

# Build Sirius Frontend:
RUN ng build
# ------------------------------------------------------------------------------------- #


# ------------------------------------------------------------------------------------- #
# FINAL STAGE:
# ------------------------------------------------------------------------------------- #
# Docker Multi stage build (Final image):
FROM nginx:alpine

LABEL version="1.3.0"
LABEL maintainer="opendicom <info@opendicom.com>"
LABEL author="Camilo Pifano Herrera <camilopifano@gmail.com>"
LABEL description="Sirius RIS is an open source Radiology Information System"

# Copy OHIF bundles:
COPY --from=ohif-bundles /usr/share/nginx/html/dcm-viewer /usr/share/nginx/html/dcm-viewer

# Change OHIF config file:
RUN rm -f /usr/share/nginx/html/dcm-viewer/app-config.js
COPY ./docker/ohif/app-config.js /usr/share/nginx/html/dcm-viewer/

# Change OHIF bundles permissions:
USER root
RUN chown -R nginx:nginx /usr/share/nginx/html/dcm-viewer/*
RUN rm /etc/nginx/conf.d/default.conf

# Copy Sirius Frontend bundles from the 'builder' image to nginx image:
COPY --from=frontend-builder /app/dist/sirius-ris /usr/share/nginx/html

# Copy nginx configuration:
COPY ./docker/nginx/default.conf /etc/nginx/conf.d/

# Copy docker directory to set main settings with enviroment vars:
COPY ./docker /docker

# Give entrypoint.sh execute permissions:
RUN chmod 755 /docker/entrypoint.sh

# Exec entrypoint:
ENTRYPOINT ["/docker/entrypoint.sh", "nginx", "-g", "daemon off;"]
# ------------------------------------------------------------------------------------- #