FROM node:18.13.0

LABEL version="1.0.0-beta.1"
LABEL maintainer="opendicom <info@opendicom.com>"
LABEL author="Camilo Pifano Herrera <camilopifano@gmail.com>"
LABEL description="Sirius RIS is an open source Radiology Information System"

ENV NODE_ENV=production

EXPOSE 3000

WORKDIR /app

# Copy source code:
# Outside Docker Build Context: Build this image from parent directory 'backend'.
# Example: docker build -t sirius-backend:1.0.0-beta.1 -f docker/Dockerfile .
COPY ../src .

RUN npm install --production

#ENTRYPOINT ['./entrypoint.sh']

USER node
CMD npm start