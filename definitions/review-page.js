/**
 * Definition for the built-in 'review' page in CASA.
 */

const qs = require('querystring');
const JourneyContext = require('../lib/JourneyContext.js');
const { rules, SimpleField } = require('../lib/validation/index.js');

module.exports = function reviewPageDefinition(pagesMeta = {}) {
  return {
    view: 'casa/review/review.njk',
    fieldValidators: {
      reviewed: SimpleField([
        rules.required,
      ]),
    },
    hooks: {
      prerender(req, res, next) {
        req.casa = req.casa || Object.create(null);

        // Determine active journey in order to define the "edit origin" URL,
        // and make journey data and errors available to templates
        const userJourney = req.casa.plan;
        const { journeyOrigin } = req.casa;
        res.locals.changeUrlPrefix = `${res.locals.casa.mountUrl}${journeyOrigin.originId || ''}/`.replace(/\/+/g, '/');
        res.locals.journeyContext = req.casa.journeyContext.getData();
        res.locals.reviewErrors = req.casa.journeyContext.getValidationErrors();

        // Determine which pages have been traversed in the user's journey in
        // order to get to this review point (not all journey waypoints will
        // have been touched, but may contain data which needs to be ignored)
        let waypointsTraversed;
        const traversalOptions = {
          startWaypoint: journeyOrigin.waypoint,
        };
        if (req.casa.journeyContext) {
          waypointsTraversed = userJourney.traverse(req.casa.journeyContext, traversalOptions);
        } else {
          waypointsTraversed = userJourney.traverse(new JourneyContext(), traversalOptions);
        }
        res.locals.reviewBlocks = waypointsTraversed.map((waypointId) => {
          const meta = pagesMeta[waypointId] || Object.create(null);
          return meta.reviewBlockView ? {
            waypointId,
            waypointEditUrl: `${res.locals.changeUrlPrefix}${waypointId}?edit&${qs.stringify({
              editorigin: req.editOriginUrl,
            })}`,
            reviewBlockView: meta.reviewBlockView,
          } : null;
        }).filter((o) => o !== null);

        next();
      },
    },
  };
};
