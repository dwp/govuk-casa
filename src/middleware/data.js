// Decorates the request with some contextual data about the user's journey
// through the application. This is used by downstream middleware and templates.

import lodash from 'lodash';
import JourneyContext from '../lib/JourneyContext.js';
import waypointUrl from '../lib/waypoint-url.js';

const { has } = lodash;

const editOrigin = (req) => {
  if (has(req.query, 'editorigin')) {
    return waypointUrl({ waypoint: req.query.editorigin });
  }
  if (has(req?.body, 'editorigin')) {
    return waypointUrl({ waypoint: req.body.editorigin });
  }
  return '';
}

export default function dataMiddleware({
  plan,
  events,
}) {
  return [
    (req, res, next) => {
      /* ------------------------------------------------ Request decorations */

      // CASA
      req.casa = {
        ...req?.casa,

        // The plan
        plan,

        // Current journey context, loaded from session, specified by
        // `contextid` request parameter
        journeyContext: JourneyContext.extractContextFromRequest(req).addEventListeners(events),

        // Edit mode
        editMode: (has(req?.query, 'edit') && has(req?.query, 'editorigin')) || (has(req?.body, 'edit') && has(req?.body, 'editorigin')),
        editOrigin: editOrigin(req),
      };

      // Grab chosen language from session
      req.casa.journeyContext.nav.language = req.session.language;

      /* ------------------------------------------------- Template variables */

      // Figure out the mount URL of the current request
      const mountUrl = `${req.baseUrl}/`.replace(/\/+/, '/');

      // CASA and userland templates
      res.locals.casa = {
        mountUrl,
        editMode: req.casa.editMode,
        editOrigin: req.casa.editOrigin,
      };
      res.locals.locale = req.language;

      // Used by govuk-frontend template
      //   htmlLang = req.language is provided by i18n-http-middleware
      //   assetPath = used for linking to static assets in the govuk-frontend module
      res.locals.htmlLang = req.language;
      res.locals.assetPath = `${mountUrl}govuk/assets`;

      // Function for building URLs. This will be curried with the `mountUrl`,
      // `journeyContext`, `edit` and `editOrigin` for convenience. This means
      // the template author does not have to be concerned about the current
      // "state" when generating URLs, but still has the ability to override
      // these curried defaults if needs be.
      res.locals.waypointUrl = (args) => waypointUrl({
        mountUrl,
        journeyContext: req.casa.journeyContext,
        edit: req.casa.editMode,
        editOrigin: req.casa.editOrigin,
        ...args,
      });

      next();
    },
  ];
}
