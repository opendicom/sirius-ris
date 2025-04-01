# ------------------------------------------------------------------------------------- #
# HOW TO BUILD:
# ------------------------------------------------------------------------------------- #
# Outside Docker Build Context: Build this image from parent directory 'backend'.
# Example:
# docker build -t opendicom/sirius-backend:1.3.0 -f docker/Dockerfile .
# ------------------------------------------------------------------------------------- #


# ------------------------------------------------------------------------------------- #
# SIRIUS BACKEND STAGE:
# ------------------------------------------------------------------------------------- #
FROM node:18.13.0

LABEL version="1.3.0"
LABEL maintainer="opendicom <info@opendicom.com>"
LABEL author="Camilo Pifano Herrera <camilopifano@gmail.com>"
LABEL description="Sirius RIS is an open source Radiology Information System"

# Set node in production:
ENV NODE_ENV=production

# Install gettext-base (envsubst):
RUN apt-get update && apt-get -y install gettext-base

# Set port:
EXPOSE 3000

# Set wordir:
WORKDIR /app

# Copy source code:
COPY ../src .

# Install dependencies (only production dependencies):
RUN npm install --omit=dev

# Copy entrypoint:
COPY ./docker/entrypoint.sh .

# Give entrypoint.sh execute permissions:
RUN chmod 755 ./entrypoint.sh

# Copy main settings template:
COPY ./docker/main.settings.template .

# Exec entrypoint:
ENTRYPOINT ["./entrypoint.sh"]
# ------------------------------------------------------------------------------------- #