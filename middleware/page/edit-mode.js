/**
 * Set `req.inEditMode`, `req.editOriginUrl`, and `req.editSearchParams`
 * attributes.
 *
 * Note `req.{query|body}.*` are all uri-decoded prior to this point.
 */

const { createGetRequest, parseRequest } = require('../../lib/utils/index.js');
const logger = require('../../lib/Logger')('page.edit-mode');

module.exports = (mountUrl, allowPageEdit) => (req, res, next) => {
  // Parse the request
  const request = parseRequest(req);
  const defaultEditOrigin = createGetRequest({
    mountUrl,
    ...request,
    editMode: false,
    editOrigin: '',
  });

  // Store edit information on request
  req.editOriginUrl = allowPageEdit ? (request.editOrigin || defaultEditOrigin) : '';
  req.inEditMode = allowPageEdit && request.editMode;
  logger.trace('Set edit mode: %s (origin = %s)', req.inEditMode, req.editOriginUrl);

  // Create a urlencoded string of the parameters for use in custom URLs
  req.editSearchParams = req.inEditMode ? createGetRequest({
    ...request,
    mountUrl: undefined,
    waypoint: undefined,
    editMode: req.inEditMode,
    editOrigin: req.editOriginUrl,
  }) : '';

  // Clean up
  // We're no longer interested in these parameters, so declutter
  if (req.query && 'edit' in req.query) {
    delete req.query.edit;
  }
  if (req.body && 'edit' in req.body) {
    delete req.body.edit;
  }
  if (req.query && 'editorigin' in req.query) {
    delete req.query.editorigin;
  }
  if (req.body && 'editorigin' in req.body) {
    delete req.body.editorigin;
  }

  // Next middleware
  next();
};
