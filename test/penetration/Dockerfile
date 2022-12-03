# To build this image for testing, run the following from the project root:
#   docker build -t casa-pentest -f test/penetration/Dockerfile .

FROM node:14-alpine@sha256:12b14bdfa8c89a1a060c53b5714157085700660b12ab7c50a907a4e19d95b6bf

ENV PORT=3000

COPY . .

CMD ["node", "test/penetration/server.js"]