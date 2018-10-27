/**
 * Definition for the built-in 'review' page in CASA.
 */

module.exports = function reviewPageDefinition(app, pageDirectory, userJourney) {
  return {
    view: 'casa/review/review.njk',
    hooks: {
      prerender(req, res, next) {
        // Determine which pages have been traversed in the user's journey in
        // order to get to this review point (not all journey waypoints will
        // have been touched, but may contain data which needs to be ignored)
        let waypointsTraversed;
        if (req.journeyData) {
          waypointsTraversed = userJourney.traverse(
            req.journeyData.getData(),
            req.journeyData.getValidationErrors()
          );
        } else {
          waypointsTraversed = userJourney.traverse();
        }
        res.locals.reviewBlocks = waypointsTraversed.map((waypointId) => {
          const meta = pageDirectory.getPageMeta(waypointId) || {};
          return meta.reviewBlockView ? {
            waypointId,
            reviewBlockView: meta.reviewBlockView
          } : null;
        }).filter(o => o !== null);

        // Run validation on all claim data so we can alert the user to anything
        // that needs fixing. This is a safety-net check really because by the
        // time the user gets here, they should already have submitted valid
        // data, but in changing their submission, errors may well creep in.
        // TODO: Replace this with checks on the new validation errors held
        // within JourneyData
        const queue = [];
        const errors = {};
        res.locals.journeyData = req.journeyData.getData();
        waypointsTraversed.forEach((waypointId) => {
          const pageMeta = pageDirectory.getPageMeta(waypointId);
          if (
            typeof pageMeta !== 'undefined' &&
            typeof pageMeta.validator === 'function'
          ) {
            queue.push(pageMeta.validator(req.journeyData).catch((err) => {
              errors[waypointId] = err;
            }));
          }
        });

        Promise.all(queue).then(() => {
          if (Object.keys(errors).length) {
            return Promise.reject(errors);
          }
          next();
          return true;
        }).catch((validationErrors) => {
          res.locals.reviewErrors = validationErrors;
          next();
        });
      }
    }
  };
};
