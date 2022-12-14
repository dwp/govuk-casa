# To build this image for testing, run the following from the project root:
#   docker build -t casa-pentest -f test/penetration/Dockerfile .

FROM node:14-alpine@sha256:80e825b1f5ab859498a2f0f98f8197131a562906e5f8c95977057502e68ca05a

ENV PORT=3000

COPY . .

CMD ["node", "test/penetration/server.js"]