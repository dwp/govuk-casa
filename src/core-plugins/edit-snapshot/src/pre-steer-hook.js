import logger from "../../../lib/logger.js";
import {
  FLAG_FOR_PURGING,
  snapshotExists,
  recoverSnapshot,
  createSnapshot,
  reachedEditOrigin,
} from "./utils.js";

const log = logger("lib:internal-plugin:edit-snapshot:pre-steer-hook");

export default (req, res, next) => {
  if (req.query.editcancel && snapshotExists(req)) {
    log.debug(
      "Edit workflow was actively canceled. Snapshot will be recovered.",
    );
    recoverSnapshot(log, req);
    return req.session.save(next);
  }

  if (!req.casa.editMode && snapshotExists(req)) {
    log.debug("Edit workflow passively canceled. Snapshot will be recovered.");
    recoverSnapshot(log, req);
    return req.session.save(next);
  }

  if (req.casa.editMode && reachedEditOrigin(log, req)) {
    log.trace(
      `Editing workflow has reached editorigin. Purge MAY be carried out in poststeer hook on context '${req.casa.journeyContext.identity.id}'.`,
    );
    // eslint-disable-next-line security/detect-object-injection
    req.casa[FLAG_FOR_PURGING] = true;
    return next();
  }

  if (req.casa.editMode && !snapshotExists(req)) {
    log.debug("Editing workflow has just started. Will create snapshot.");
    createSnapshot(log, req);
    return req.session.save(next);
  }

  next();
};
