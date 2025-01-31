# To build this image for testing, run the following from the project root:
#   docker build -t casa-pentest -f test/penetration/Dockerfile .

FROM node:16@sha256:f77a1aef2da8d83e45ec990f45df50f1a286c5fe8bbfb8c6e4246c6389705c0b

EXPOSE 3000

ENV PORT=3000

RUN mkdir -p /opt/app
WORKDIR /opt/app

COPY . .

CMD ["node", "test/penetration/server.js"]