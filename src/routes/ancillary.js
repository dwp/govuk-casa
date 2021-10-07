import MutableRouter from '../lib/MutableRouter.js';

/**
 * Create an instance of the ancillary router.
 *
 * @param {Object} options = Optiona
 * @param {number} options.sessionTtl Session timeout (seconds)
 * @returns {MutableRouter} Mutable router
 */
export default function ancillaryRouter({
  sessionTtl,
}) {
  // Router
  const router = new MutableRouter();

  // Session timeout
  // TODO: add a `ancillary.presessiontimeout` hook here? Might be useful for
  // those who way to enhance the timeout route, rather than replacing it completely
  router.all('/session-timeout', (req, res) => {
    res.render('casa/session-timeout.njk', {
      sessionTtl: Math.floor(sessionTtl / 60),
    });
  });

  return router;
}
