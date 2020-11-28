// Create an object in `req.casa.journeyContext` to represent the data gathered
// during the user's journey through the defined pages.

const { DEFAULT_CONTEXT_ID } = require('../../lib/enums.js');
const commonBodyParser = require('../../lib/commonBodyParser.js');
const JourneyContext = require('../../lib/JourneyContext.js');

const extractRequestedContextId = (request) => {
  let contextId;

  switch (request.method) {
  case 'GET':
    contextId = request.query.contextid;
    break;
  case 'POST':
    contextId = request.body.contextid;
    break;
  default:
    break;
  }

  return contextId || DEFAULT_CONTEXT_ID;
};

module.exports = (logger) => ([commonBodyParser, (req, res, next) => {
  if (!req.session) {
    next();
    return;
  }

  req.casa = req.casa || Object.create(null);

  // Load requested journey context from session. This will remain the "active
  // context" for the duration of the request.
  JourneyContext.initContextStore(req.session);
  let contextId = extractRequestedContextId(req);
  try {
    contextId = JourneyContext.validateContextId(contextId);
    req.casa.journeyContext = JourneyContext.getContextById(req.session, contextId);
  } catch (ex) {
    logger.info(ex.message);
  }
  if (!req.casa.journeyContext) {
    logger.info(`Context '${contextId}' not found. Will use 'default'`);
    req.casa.journeyContext = JourneyContext.getContextById(req.session, DEFAULT_CONTEXT_ID);
    // TODO: remove contextid from req.query / req.body?
  }

  next();
}]);
