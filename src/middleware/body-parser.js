import { urlencoded as expressBodyParser } from 'express';

export default function bodyParserMiddleware() {
  const rProto = /__proto__/i;
  const rPrototype = /prototype[='"[\]]/i;
  const rConstructor = /constructor[='"[\]]/i;

  return [
    expressBodyParser({
      extended: true,
      type: 'application/x-www-form-urlencoded',
      inflate: true,
      parameterLimit: 25, // TODO: make configurable?
      limit: 1024 * 50, // TODO: make configurable?
      verify: (req, res, buf, encoding) => {
        const body = decodeURI(buf.toString(encoding));
        if (rProto.test(body) || rPrototype.test(body) || rConstructor.test(body)) {
          throw new Error('Request body verification failed');
        }
      },
    }),
  ];
}
