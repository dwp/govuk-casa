# To build this image for testing, run the following from the project root:
#   docker build -t casa-pentest -f test/penetration/Dockerfile .

FROM node:14-alpine@sha256:673f1dc6309e996c308032ad0e86c3270a76767c54e1bb8d23e45a84361a8245

ENV PORT=3000

COPY . .

CMD ["node", "test/penetration/server.js"]