import { urlencoded as expressBodyParser } from "express";

const rProto = /__proto__/i;
const rPrototype = /prototype[='"[\]]/i;
const rConstructor = /constructor[='"[\]]/i;

/**
 * @param req
 * @param res
 * @param buf
 * @param encoding
 */
export function verifyBody(req, res, buf, encoding) {
  const body = decodeURI(buf.toString(encoding)).replace(
    /[\s\u200B-\u200D\uFEFF]/g,
    "",
  );
  if (rProto.test(body)) {
    throw new Error("Request body verification failed (__proto__)");
  }
  if (rPrototype.test(body)) {
    throw new Error("Request body verification failed (prototype)");
  }
  if (rConstructor.test(body)) {
    throw new Error("Request body verification failed (constructor)");
  }
}

/**
 * @param opts
 * @param opts.formMaxParams
 * @param opts.formMaxBytes
 */
export default function bodyParserMiddleware({ formMaxParams, formMaxBytes }) {
  return [
    expressBodyParser({
      extended: true,
      type: "application/x-www-form-urlencoded",
      inflate: true,
      parameterLimit: formMaxParams,
      limit: formMaxBytes,
      verify: verifyBody,
    }),
  ];
}
