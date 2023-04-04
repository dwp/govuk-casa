# To build this image for testing, run the following from the project root:
#   docker build -t casa-pentest -f test/penetration/Dockerfile .

FROM node:14-alpine@sha256:434215b487a329c9e867202ff89e704d3a75e554822e07f3e0c0f9e606121b33

ENV PORT=3000

COPY . .

CMD ["node", "test/penetration/server.js"]