# To build this image for testing, run the following from the project root:
#   docker build -t casa-pentest -f test/penetration/Dockerfile .

FROM node:14.21.3-alpine@sha256:434215b487a329c9e867202ff89e704d3a75e554822e07f3e0c0f9e606121b33

EXPOSE 3000

ENV PORT=3000

RUN mkdir -p /opt/app
WORKDIR /opt/app

COPY . .

CMD ["node", "test/penetration/server.js"]