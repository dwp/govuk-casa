# To build this image for testing, run the following from the project root:
#   docker build -t casa-pentest -f test/penetration/Dockerfile .

FROM node:14-alpine@sha256:2825e1c8aad5786d79d6fce6ce14cf4c903bd4e03b84f586afe4e39430665fe4

ENV PORT=3000

COPY . .

CMD ["node", "test/penetration/server.js"]