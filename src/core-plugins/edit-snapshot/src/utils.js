/* eslint-disable security/detect-object-injection */
import { JourneyContext } from "../../../casa.js";

const SESSION_KEY = "casa_edit_snapshots";

export const FLAG_FOR_PURGING = Symbol("flag_to_purge_edit_snapshot");

export const snapshotExists = (req) => {
  return (
    req?.session[SESSION_KEY] &&
    Object.hasOwn(req.session[SESSION_KEY], req.casa.journeyContext.identity.id)
  );
};

export const reachedEditOrigin = (log, req) => {
  const { pathname: currentPathname } = new URL(
    req.originalUrl,
    "https://placeholder.test/",
  );
  const { pathname: editOriginPathname } = new URL(
    req.casa.editOrigin,
    "https://placeholder.test/",
  );

  return editOriginPathname === currentPathname;
};

export const createSnapshot = (log, req) => {
  log.debug(
    `Creating a new edit snapshot for context '${req.casa.journeyContext.identity.id}'`,
  );
  req.session[SESSION_KEY] ??= Object.create(null);
  req.session[SESSION_KEY][req.casa.journeyContext.identity.id] =
    req.casa.journeyContext.toObject();
};

export const recoverSnapshot = (log, req) => {
  log.debug(
    `Recovering snapshot for context '${req.casa.journeyContext.identity.id}'`,
  );
  req.casa.journeyContext.configureFromObject(
    req.session[SESSION_KEY][req.casa.journeyContext.identity.id],
  );
  JourneyContext.putContext(req.session, req.casa.journeyContext);
  deleteSnapshot(log, req);
};

export const deleteSnapshot = (log, req) => {
  log.debug(
    `Purging edit snapshot for context '${req.casa.journeyContext.identity.id}'`,
  );
  req.session[SESSION_KEY][req.casa.journeyContext.identity.id] = undefined;
};
