/**
 * Set `req.inEditMode` and `req.editOriginUrl` attributes.
 *
 * Note `req.query.*` are all uri-decoded prior to this point.
 */

const { URL } = require('url');

module.exports = allowPageEdit => (req, res, next) => {
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

  // Extract path name from edit origin url
  try {
    const u = new URL(editOriginUrl, 'http://placeholder.test');
    req.editOriginUrl = u.pathname.replace(/^\/+$/, '');
  } catch (e) {
    req.editOriginUrl = '';
  }
  req.inEditMode = inEditMode;

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
