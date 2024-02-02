// Sanitise the fields submitted from a form
// - Coerce each field to its correct type
// - Remove an extraneous fields that are not know to the application

import _ from "lodash";
import fieldFactory from "../lib/field.js";
import JourneyContext from "../lib/JourneyContext.js";

export default ({ waypoint, fields = [] }) => {
  // Add some common, transient fields to ensure they survive beyond this sanitisation process
  fields.push(
    fieldFactory("_csrf", { persist: false }).processor((value) =>
      String(value),
    ),
  );
  fields.push(
    fieldFactory("contextid", { persist: false }).processor((value) =>
      String(value),
    ),
  );
  fields.push(
    fieldFactory("edit", { persist: false }).processor((value) =>
      String(value),
    ),
  );
  fields.push(
    fieldFactory("editorigin", { persist: false }).processor((value) =>
      String(value),
    ),
  );

  // Middleware
  return [
    (req, res, next) => {
      // First, prune all undefined, or unknown fields from `req.body` (i.e.
      // those that do not have an entry in `fields`)
      // EsLint disabled as `fields`, `i` & `name` are only controlled by dev
      /* eslint-disable security/detect-object-injection */
      const prunedBody = Object.create(null);
      for (let i = 0, l = fields.length; i < l; i++) {
        if (
          _.has(req.body, fields[i].name) &&
          req.body[fields[i].name] !== undefined
        ) {
          prunedBody[fields[i].name] = req.body[fields[i].name];
        }
      }
      /* eslint-enable security/detect-object-injection */

      const journeyContext = JourneyContext.fromContext(
        req.casa.journeyContext,
        req,
      );
      journeyContext.setDataForPage(waypoint, prunedBody);

      // Second, prune any fields that do not pass the validation conditional,
      // and process those that do.
      const sanitisedBody = Object.create(null);
      for (let i = 0, l = fields.length; i < l; i++) {
        const field =
          fields[i]; /* eslint-disable-line security/detect-object-injection */
        const fieldValue = field.getValue(prunedBody);

        if (
          fieldValue !== undefined &&
          field.testConditions({
            fieldValue,
            waypoint,
            journeyContext,
          })
        ) {
          field.putValue(sanitisedBody, field.applyProcessors(fieldValue));
        }
      }

      // Finally, write the sanitised body back to the request object
      req.body = sanitisedBody;
      next();
    },
  ];
};
