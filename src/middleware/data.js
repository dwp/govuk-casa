// Decorates the request with some contextual data about the user's journey
// through the application. This is used by downstream middleware and templates.

import JourneyContext from "../lib/JourneyContext.js";
import { validateUrlPath } from "../lib/utils.js";
import waypointUrl from "../lib/waypoint-url.js";

const editOrigin = (req) => {
  if (Object.hasOwn(req.query, "editorigin")) {
    return waypointUrl({ waypoint: req.query.editorigin });
  }
  if (req.body && Object.hasOwn(req.body, "editorigin")) {
    return waypointUrl({ waypoint: req.body.editorigin });
  }
  return "";
};

export default function dataMiddleware({ plan, events, contextIdGenerator }) {
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
        journeyContext:
          JourneyContext.extractContextFromRequest(req).addEventListeners(
            events,
          ),

        // Edit mode
        editMode:
          (Object.hasOwn(req.query, "edit") && Object.hasOwn(req.query, "editorigin")) ||
          (Object.hasOwn(req.body, "edit") && Object.hasOwn(req.body, "editorigin")),
        editOrigin: editOrigin(req),
      };

      // Grab chosen language from session
      req.casa.journeyContext.nav.language = req.session.language;

      // Context ID generator
      Object.defineProperty(req, JourneyContext.ID_GENERATOR_REQ_KEY, {
        value: contextIdGenerator,
        enumerable: false,
        writable: false,
      });

      /* ------------------------------------------------- Template variables */

      // Capture mount URL that will be used in generating all browser URLs
      const mountUrl = validateUrlPath(`${req.baseUrl}/`.replace(/\/+/g, "/"));

      // If this CASA app is mounted on a parameterised route, then all of its
      // static assets (served by `staticRouter`) will, by default, be served
      // from that dynamic path, for example:
      //   markup:       <link href="{{ mountUrl }}css/static.css" />
      //   resolved URL: /mount/<some-id-here>/css/static.css
      //   baseUrl:      /mount/<some-id>
      //
      // From a performance point of view, this is very inefficient as we can't
      // take advantage of any intermediate caches. So we instead provide am
      // alternative URL path in the `staticMountUrl` property that excludes the
      // parameterised element, eg:
      //   markup:       <link href="{{ staticMountUrl }}css/static.css" />
      //   resolved URL: /mount/css/static.css
      //   baseUrl:      /mount
      //
      // As the staticRouter is mounted on both the CASA app, and its internal
      // Router, the `baseUrl` is different in each case, so we cannot rely
      // on it to be consistent. Hence the need for this property, which will
      // always be the non-parameterised version of the baseUrl.
      const staticMountUrl = validateUrlPath(
        `${req.unparameterisedBaseUrl}/`.replace(/\/+/g, "/"),
      );

      // CASA and userland templates
      res.locals.casa = {
        mountUrl,
        staticMountUrl,
        editMode: req.casa.editMode,
        editOrigin: req.casa.editOrigin,
      };
      res.locals.locale = req.language;

      // Used by govuk-frontend template
      //   htmlLang = req.language is provided by i18n-http-middleware
      //   assetPath = used for linking to static assets in the govuk-frontend module
      res.locals.htmlLang = req.language;
      res.locals.assetPath = `${staticMountUrl}govuk/assets`;

      // Function for building URLs. This will be curried with the `mountUrl`,
      // `journeyContext`, `edit` and `editOrigin` for convenience. This means
      // the template author does not have to be concerned about the current
      // "state" when generating URLs, but still has the ability to override
      // these curried defaults if needs be.
      res.locals.waypointUrl = (args) =>
        waypointUrl({
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
