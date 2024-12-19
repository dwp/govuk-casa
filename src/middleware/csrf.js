import { csrfSync } from "csrf-sync";

/**
 * @typedef {import("express").RequestHandler} RequestHandler
 * @access private
 */

/**
 * Data middleware.
 *
 * 2 middleware: one to generate the csrf token and check its validity (POST
 * only), and one to provide that token to templates via the `casa.csrfToken`
 * variable.
 *
 * @returns {RequestHandler[]} Middleware functions
 */
export default function csrfMiddleware() {
  const { csrfSynchronisedProtection } = csrfSync({
    getTokenFromRequest: (req) => req.body._csrf,
  });
  return [
    csrfSynchronisedProtection,
    (req, res, next) => {
      res.locals.casa = {
        ...res.locals?.casa,
        csrfToken: req.csrfToken(),
      };
      next();
    },
  ];
}
