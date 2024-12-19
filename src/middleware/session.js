// A last-modified cookie is used to control whether the end user sees a
// session-timeout page, or they are simply given a new session without
// interrupting their journey.
import expressSession, { MemoryStore } from "express-session";
import logger from "../lib/logger.js";
import { validateUrlPath } from "../lib/utils.js";

/**
 * @typedef {import("express").RequestHandler} RequestHandler
 * @access private
 */

const log = logger("middleware:session");

const sessionExpiryMiddleware =
  (ttl, getCookie, touchCookie, removeCookie) => (req, res, next) => {
    const lastModified = getCookie(req);
    const age = Math.floor(Date.now() * 0.001) - lastModified;

    if (lastModified === 0) {
      // New session, or grace period cookie no longer available after
      // expiring; generate a new session, and create grace-period cookie.
      // This will invalidate any CSRF tokens, so by letting the request POST
      // requests through the user may see a 500 error response.
      log.info(
        "Session is new, or grace period has expired. Regenerating session.",
      );
      req.session.regenerate((err) => {
        if (err) {
          next(err);
        } else {
          touchCookie(res);
          if (req.method === "POST") {
            log.info(
              "The CSRF token for this POST request will now be invalid for this regenerated session. Redirecting to app mount point.",
            );
            res.redirect(302, validateUrlPath(`${req.baseUrl}/`));
          } else {
            next();
          }
        }
      });
    } else if (age > ttl) {
      // Cookie has become stale and server session will have been removed;
      // redirect to session-timeout
      log.info(
        "Session has timed out within grace period. Destroying session and redirecting to timeout page.",
      );
      const language = req.session.language ?? "en";
      req.session.destroy((err) => {
        if (err) {
          next(err);
        } else {
          removeCookie(res);
          const params = new URLSearchParams({
            referrer: req.originalUrl,
            lang: language,
          });

          res.redirect(
            302,
            validateUrlPath(`${req.baseUrl}/session-timeout`) +
              `?${params.toString()}`,
          );
        }
      });
    } else {
      // Touch cookie and continue
      touchCookie(res);
      next();
    }
  };

/**
 * Produces three middleware functions:
 *
 * - Set the session cookie
 * - Parse request cookies
 * - Handle expiry of server-side session
 *
 * @param {object} opts Options
 * @param {RequestHandler} opts.cookieParserMiddleware Cookie parsing middleware
 * @param {string} opts.secret Session encryption secret
 * @param {string} opts.name Session cookie name
 * @param {boolean} opts.secure Secure cookies only
 * @param {number} opts.ttl Session data time-to-live
 * @param {boolean | string} [opts.cookieSameSite] Cooke SameSite setting
 * @param {string} [opts.cookiePath] Cookie path
 * @param {object} [opts.store] Storage instance
 * @returns {RequestHandler[]} Middleware functions
 */
export default function sessionMiddleware({
  cookieParserMiddleware,
  secret,
  name,
  secure,
  ttl,
  cookieSameSite = true,
  cookiePath = "/",
  store = new MemoryStore(),
}) {
  const commonCookieOptions = {
    httpOnly: true,
    path: cookiePath,
    secure,
  };

  if (cookieSameSite !== false) {
    commonCookieOptions.sameSite =
      cookieSameSite === true ? "Strict" : cookieSameSite;
  }

  const ttlGrace = 1800; // user will see session-timeout if session expires within 30mins
  const touchCookieName = `${name}.t`;
  const touchCookieOptions = {
    ...commonCookieOptions,
    maxAge: (ttl + ttlGrace) * 1000,
    signed: true,
  };

  const getCookie = (req) => {
    // Disabled eslint as `touchCookieName` is a constant, known value
    const lastModified = Date.parse(
      /* eslint-disable-next-line security/detect-object-injection */
      String(req.signedCookies[touchCookieName] ?? "1970-01-01T00:00:00+0000"),
    );
    return Number.isNaN(lastModified) ? 0 : Math.floor(lastModified * 0.001);
  };

  const touchCookie = (res) => {
    // Touch cookie expiry is a short period after the session ttl. This gives
    // a small period of time where a user will see the session-timeout message,
    // which is important to avoid the confusion of simply being redirected back
    // to the start of their journey.
    res.cookie(
      touchCookieName,
      new Date(Date.now()).toUTCString(),
      touchCookieOptions,
    );
  };

  const removeCookie = (res) => {
    res.clearCookie(touchCookieName, touchCookieOptions);
  };

  return [
    expressSession({
      secret,
      name,
      saveUninitialized: false,
      resave: false,
      cookie: {
        ...commonCookieOptions,
        maxAge: null,
      },
      store,
    }),
    cookieParserMiddleware,
    sessionExpiryMiddleware(ttl, getCookie, touchCookie, removeCookie),
  ];
}
