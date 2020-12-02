/**
 * Set `req.inEditMode`, `req.editOriginUrl`, and `req.editSearchParams`
 * attributes.
 *
 * Note `req.query.*` are all uri-decoded prior to this point.
 */

const { URL } = require('url');
const { makeEditLink, sanitiseAbsolutePath } = require('../../lib/utils/index.js');
const logger = require('../../lib/Logger')('page.edit-mode');

module.exports = (allowPageEdit) => (req, res, next) => {
  let inEditMode = false;
  let editOriginUrl = '';

  // By default, we'll assume that the current page is the "review" page which
  // users will be guided back to after editing a page.
  const DEFAULT_REVIEW_URL = `${req.originalUrl || ''}`;

  if (allowPageEdit) {
    if (req.method === 'GET') {
      inEditMode = req.query && 'edit' in req.query;
      editOriginUrl = req.query && 'editorigin' in req.query ? req.query.editorigin : DEFAULT_REVIEW_URL;
    } else if (req.method === 'POST') {
      inEditMode = req.body && 'edit' in req.body;
      editOriginUrl = req.body && 'editorigin' in req.body ? req.body.editorigin : DEFAULT_REVIEW_URL;
    }
  }

  // Extract pathname from the provided editOriginUrl
  try {
    editOriginUrl = (new URL(editOriginUrl, 'http://placeholder.test')).pathname;
  } catch (e) {
    editOriginUrl = '';
  }

  // Store edit information on request
  req.editOriginUrl = allowPageEdit ? sanitiseAbsolutePath(editOriginUrl) : '';
  req.inEditMode = inEditMode;
  logger.trace('Set edit mode: %s (origin = %s)', req.inEditMode, req.editOriginUrl);

  // Create a urlencoded string of the parameters for use in custom URLs
  req.editSearchParams = req.inEditMode ? makeEditLink({ origin: req.editOriginUrl }) : '';

  // Clean up
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

  next();
};
