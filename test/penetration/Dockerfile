# To build this image for testing, run the following from the project root:
#   docker build -t casa-pentest -f test/penetration/Dockerfile .

FROM node:14-alpine@sha256:1d02d4073d7dfd58950a222a862f8b819afd774560b7b3e992b27ff4cd088285

ENV PORT=3000

COPY . .

CMD ["node", "test/penetration/server.js"]