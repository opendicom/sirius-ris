# ------------------------------------------------------------------------------------- #
# SIRIUS FRONTEND BUILD:
# ------------------------------------------------------------------------------------- #
# Outside Docker Build Context: Build this image from parent directory 'frontend'.
# Example: docker build -t sirius-frontend:1.0.0-beta.1 -f docker/Dockerfile .
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

# Copy src, docker(templates) and nginx configuration:
COPY ../ .

# Install all dependencies (prod and dev):
RUN npm install

# Give set_enviroment.sh execute permissions:
RUN chmod 755 ./docker/set_enviroment.sh

# Set enviroment.prod.ts file based on environment.template:
RUN ./docker/set_enviroment.sh

# Build:
RUN ng build

# Docker Multi stage build (Final image):
FROM nginx:alpine

LABEL version="1.0.0-beta.1"
LABEL maintainer="opendicom <info@opendicom.com>"
LABEL author="Camilo Pifano Herrera <camilopifano@gmail.com>"
LABEL description="Sirius RIS is an open source Radiology Information System"

# Copy bundles project and nginx configurations from the 'builder' image to nginx image:
COPY --from=builder /app/nginx/templates /etc/nginx/templates
COPY --from=builder /app/nginx/ssl /etc/ssl/
COPY --from=builder /app/dist/sirius-ris /usr/share/nginx/html
# ------------------------------------------------------------------------------------- #