import { urlencoded as expressBodyParser } from "express";

/**
 * @typedef {import("express").RequestHandler} RequestHandler
 * @access private
 */

/**
 * @typedef {import("express").Request} Request
 * @access private
 */

/**
 * @typedef {import("express").Response} Response
 * @access private
 */

const rProto = /__proto__/i;
const rPrototype = /prototype[='"[\]]/i;
const rConstructor = /constructor[='"[\]]/i;

/**
 * Verify request body.
 *
 * @param {Request} req HTTP request
 * @param {Response} res HTTP response
 * @param {Buffer} buf Buffer
 * @param {string} encoding Character encoding
 * @returns {void}
 * @throws {Error} For invalid bodies
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
 * Body parsing middleware.
 *
 * @param {object} opts Options
 * @param {number} opts.formMaxParams Max number of parameters that should be
 *   parsed
 * @param {number} opts.formMaxBytes Max bytes that should be read
 * @returns {RequestHandler[]} Middleware functions
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
