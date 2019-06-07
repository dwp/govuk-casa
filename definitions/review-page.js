/**
 * Definition for the built-in 'review' page in CASA.
 */

const qs = require('querystring');
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
        // Determine active journey in order to define the "edit origin" URL,
        // and make journey data and errors available to templates
        const userJourney = req.journeyActive;
        res.locals.changeUrlPrefix = `${res.locals.casa.mountUrl}${req.journeyActive.guid || ''}/`.replace(/\/+/g, '/');
        res.locals.journeyData = req.journeyData.getData();
        res.locals.reviewErrors = req.journeyData.getValidationErrors();

        // Determine which pages have been traversed in the user's journey in
        // order to get to this review point (not all journey waypoints will
        // have been touched, but may contain data which needs to be ignored)
        let waypointsTraversed;
        if (req.journeyData) {
          waypointsTraversed = userJourney.traverse(
            req.journeyData.getData(),
            req.journeyData.getValidationErrors(),
          );
        } else {
          waypointsTraversed = userJourney.traverse();
        }
        res.locals.reviewBlocks = waypointsTraversed.map((waypointId) => {
          const meta = pagesMeta[waypointId] || {};
          return meta.reviewBlockView ? {
            waypointId,
            waypointEditUrl: `${res.locals.changeUrlPrefix}${waypointId}?edit&${qs.stringify({
              editorigin: req.editOriginUrl,
            })}`,
            reviewBlockView: meta.reviewBlockView,
          } : null;
        }).filter(o => o !== null);

        next();
      },
    },
  };
};
