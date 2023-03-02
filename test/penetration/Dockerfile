# To build this image for testing, run the following from the project root:
#   docker build -t casa-pentest -f test/penetration/Dockerfile .

FROM node:14-alpine@sha256:49d052af1616dbf5f2bd8b71fca9a4b7c688955e72bbe3e0126c4b28d7675577

ENV PORT=3000

COPY . .

CMD ["node", "test/penetration/server.js"]