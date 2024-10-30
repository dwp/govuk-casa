import MutableRouter from "../lib/MutableRouter.js";

/**
 * @typedef {object} AncillaryRouterOptions Options to configure static router
 * @property {number} sessionTtl Session timeout (seconds)
 */

/**
 * Create an instance of the ancillary router.
 *
 * @param {AncillaryRouterOptions} options Options
 * @returns {MutableRouter} ExpressJS Router instance
 * @access private
 */
export default function ancillaryRouter({ sessionTtl }) {
  // Router
  const router = new MutableRouter({ mergeParams: true });

  // Session timeout
  router.all("/session-timeout", (req, res) => {
    res.render("casa/session-timeout.njk", {
      sessionTtl: Math.floor(sessionTtl / 60),
    });
  });

  return router;
}
