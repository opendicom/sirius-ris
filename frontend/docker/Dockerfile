# ------------------------------------------------------------------------------------- #
# SIRIUS FRONTEND BUILD:
# ------------------------------------------------------------------------------------- #
# Outside Docker Build Context: Build this image from parent directory 'frontend'.
# Example: docker build -t opendicom/sirius-frontend:1.0.0-beta.3 -f docker/Dockerfile .
# ------------------------------------------------------------------------------------- #
# Set builder image:
FROM node:18 as builder

# Install gettext-base (envsubst):
RUN apt-get update && apt-get -y install gettext-base

# Install angular cli and devkit builder (Global dev dependencies):
RUN npm install -g @angular/cli@13.1.2
RUN npm install -g @angular-devkit/build-angular@13.1.2

# Set workdir:
WORKDIR /app

# Copy src:
COPY ../ .

# Install all dependencies (prod and dev):
RUN npm install

# Build:
RUN ng build

# Docker Multi stage build (Final image):
FROM nginx:alpine

LABEL version="1.0.0-beta.3"
LABEL maintainer="opendicom <info@opendicom.com>"
LABEL author="Camilo Pifano Herrera <camilopifano@gmail.com>"
LABEL description="Sirius RIS is an open source Radiology Information System"

# Copy bundles project from the 'builder' image to nginx image:
COPY --from=builder /app/dist/sirius-ris /usr/share/nginx/html

# Copy nginx configuration and SSL certificates:
COPY ./nginx/templates /etc/nginx/templates
COPY ./nginx/ssl /etc/ssl/

# Copy docker directory to set main settings with enviroment vars:
COPY ./docker /docker

# Give entrypoint.sh execute permissions:
RUN chmod 755 /docker/entrypoint.sh

# Exec entrypoint:
ENTRYPOINT ["/docker/entrypoint.sh", "nginx", "-g", "daemon off;"]
# ------------------------------------------------------------------------------------- #