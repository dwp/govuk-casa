// Validate the data captured in the journey context
import JourneyContext from "../lib/JourneyContext.js";
import { REQUEST_PHASE_VALIDATE } from "../lib/constants.js";

const updateContext = ({
  waypoint,
  errors = null,
  journeyContext,
  session,
}) => {
  // Set validation state
  if (errors === null) {
    journeyContext.clearValidationErrorsForPage(waypoint);
  } else {
    journeyContext.setValidationErrorsForPage(waypoint, errors);
  }

  // Save to session
  JourneyContext.putContext(session, journeyContext, {
    userInfo: {
      casaRequestPhase: REQUEST_PHASE_VALIDATE,
    },
  });
};

export default ({ waypoint, fields = [], plan }) => [
  (req, res, next) => {
    const mountUrl = `${req.baseUrl}/`;

    // Run validators for every field to build up a complete list of errors
    // currently associated with this waypoint.
    let errors = [];
    for (let i = 0, l = fields.length; i < l; i++) {
      /* eslint-disable security/detect-object-injection */
      // Dynamic object keys are only used on known entities (fields, waypoint)
      const field = fields[i];
      const fieldName = field.name;
      const fieldValue = req.casa.journeyContext.data?.[waypoint]?.[fieldName];

      // (type = ValidateContext)
      const context = {
        fieldName,
        fieldValue,
        waypoint,
        journeyContext: req.casa.journeyContext,
      };
      /* eslint-enable security/detect-object-injection */

      errors = [...errors, ...field.runValidators(fieldValue, context)];
    }

    // Validation passed with no errors
    if (!errors.length) {
      updateContext({
        waypoint,
        session: req.session,
        mountUrl,
        plan,
        journeyContext: req.casa.journeyContext,
      });
      return next();
    }

    // If there are any native errors in the list, we need to bail the request
    const nativeError = errors.find((e) => e instanceof Error);
    if (nativeError) {
      return next(nativeError);
    }

    // Make the errors available to downstream middleware
    updateContext({
      errors,
      waypoint,
      session: req.session,
      mountUrl,
      plan,
      journeyContext: req.casa.journeyContext,
    });

    return next();
  },
];
