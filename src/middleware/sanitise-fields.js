// Sanitise the fields submitted from a form
// - Coerce each field to its correct type
// - Remove an extraneous fields that are not know to the application

import _ from 'lodash';
import fieldFactory from '../lib/field.js';
import JourneyContext from '../lib/JourneyContext.js';

export default ({
  waypoint,
  fields = [],
}) => {
  // Add some common, transient fields to ensure they survive beyond this sanitisation process
  fields.push(fieldFactory('_csrf', { persist: false }).processor((value) => String(value)));
  fields.push(fieldFactory('contextid', { persist: false }).processor((value) => String(value)));
  fields.push(fieldFactory('edit', { persist: false }).processor((value) => String(value)));
  fields.push(fieldFactory('editorigin', { persist: false }).processor((value) => String(value)));

  // Middleware
  return [
    (req, res, next) => {
      // First, prune all undefined, or unknown fields from `req.body` (i.e.
      // those that do not have an entry in `fields`)
      const prunedBody = Object.create(null);
      for (let i = 0, l = fields.length; i < l; i++) {
        if (_.has(req.body, fields[i].name) && req.body[fields[i].name] !== undefined) {
          prunedBody[fields[i].name] = req.body[fields[i].name];
        }
      }

      // TODO: the journey context passed to the processors and conditions, with
      // data set to the "prunedBody"
      const journeyContext = JourneyContext.fromContext(req.casa.journeyContext);
      journeyContext.setDataForPage(waypoint, prunedBody);
      // const journeyContext = {};

      // Second, prune any fields that do not pass the validation conditional,
      // and process those that do.
      const sanitisedBody = Object.create(null);
      for (let i = 0, l = fields.length; i < l; i++) {
        const field = fields[i];
        const fieldValue = field.getValue(prunedBody) // prunedBody[field.name];

        if (fieldValue !== undefined && field.testConditions({
          fieldValue,
          waypoint,
          journeyContext,
        })) {
          field.putValue(sanitisedBody, field.applyProcessors(fieldValue));
        }
      }

      // Finally, write the sanitised body back to the request object
      req.body = sanitisedBody;
      next();
    },
  ];
}
