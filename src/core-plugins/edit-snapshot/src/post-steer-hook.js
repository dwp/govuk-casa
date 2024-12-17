import logger from "../../../lib/logger.js";
import { FLAG_FOR_PURGING, deleteSnapshot } from "./utils.js";

const log = logger("lib:internal-plugin:edit-snapshot:post-steer-hook");

export default (req, res, next) => {
  // Snapshot purging is carried out here rather than in the presteer hook,
  // because the `middleware/steer-journey.js` middleware first needs the opportunity
  // to redirect if the journey cannot be traversed to the edit origin.
  // eslint-disable-next-line security/detect-object-injection
  if (req.casa[FLAG_FOR_PURGING] === true) {
    log.debug(
      `Snapshot purging flag has been set for context '${req.casa.journeyContext.identity.id}'. Snapshot will be deleted.`,
    );
    deleteSnapshot(log, req);
    // eslint-disable-next-line security/detect-object-injection
    req.casa[FLAG_FOR_PURGING] = false;
    return req.session.save(next);
  }

  next();
};
