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
  router.all('/session-timeout', (req, res) => {
    res.render('casa/session-timeout.njk', {
      sessionTtl: Math.floor(sessionTtl / 60),
    });
  });

  return router;
}
