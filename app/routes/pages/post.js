/**
 * Generic POST handler for pages within a journey.
 */

const loggerFunction = require('../../../lib/Logger');
const Validation = require('../../../lib/Validation');
const PageDirectory = require('../../../lib/PageDirectory');
const UserJourney = require('../../../lib/UserJourney');
const util = require('../../../lib/Util');

/**
 * Generic wrapper for executing one of the page hooks.
 *
 * The returned Promise will always resolve unless the hook function ends the
 * response with something like `res.send()`.
 *
 * @param  {Logger} logger Request-specific Logger instance
 * @param  {request} req Express request
 * @param  {response} res Express response
 * @param  {object} pageMeta Metadata of page being processed
 * @param  {string} hookName Name of hook to execute
 * @return {Promise} Promise
 */
function executeHook(logger, req, res, pageMeta, hookName) {
  return new Promise((resolve) => {
    const hooks = pageMeta && pageMeta.hooks ? pageMeta.hooks : {};
    if (typeof hooks[hookName] === 'function') {
      logger.debug(`Run ${hookName} hook for ${req.journeyWaypointId}`);
      hooks[hookName](req, res, () => {
        // Will not resolve if hook executes `res.send()`
        resolve();
      });
    } else {
      resolve();
    }
  });
}

/**
 * This does the opposite of objectPathValue
 * it set the value of the propeerty field in the pageData object to value.
 *
 * objectPathValue uses the module object-resolve-path to do a sort of home made hacky xpath
 * to get a value given a path. Problem is that it only gets the value and does not export a
 * way of getting the path or setting the value at the path.
 * So this is a hacky fix for that
 *
 * For the basic gatherModifiers the field will be the same as the path so it should be ok
 * need more work on this.
 *
 * @param {object} obj Object to traverse
 * @param {string} paths Path component(s) to use
 * @return {mixed} The value of the object, or `undefined` if not found
 */
/* eslint-disable-next-line consistent-return,require-jsdoc */
function replaceObjectPathValue(pageData, field, value) {
  try {
    const pageData2 = pageData;
    pageData2[field] = value;
  } catch (err) {
    const logger = loggerFunction('routes');
    logger.debug('exception in replaceObjectPathValue');
  }
}

/**
 * Add a validator object to the processing queue.
 *
 * @param  {object} pageData Full page data from which data is extracted
 * @param  {string} field Field to validate (in square-brace notation)
 * @param  {array or function} gatherModifiers, either an array of functions or a single function
 * @return {void}
 */
/* eslint-disable-next-line consistent-return,require-jsdoc */
function runGatherModifiers(pageData, field, gatherModifiers) {
  const modifiers = typeof gatherModifiers === 'function' ? [gatherModifiers] : gatherModifiers;
  if (Array.isArray(modifiers)) {
    let fieldValue = util.objectPathValue(pageData, field);
    modifiers.forEach((m) => {
      fieldValue = m({ fieldValue });
    });
    replaceObjectPathValue(pageData, field, fieldValue);
  }
}

/**
 * GatherModifier the data using the page's defined field gatherModifiers.
 *
 *
 * @param {Logger} logger Request-specific logger instance
 * @param {request} req Express request obejct
 * @param {object} pageMeta Metadata of page being evalutated
 * @return {Promise} Promise (always resolves, unless hook intercepts)
 */
function doGatherDataModification(logger, req, pageMeta) {
  if (pageMeta && pageMeta.fieldGatherModifiers) {
    logger.debug(`Run munging for ${req.journeyWaypointId}`);

    Object.keys(pageMeta.fieldGatherModifiers).forEach((field) => {
      runGatherModifiers(req.body, field, pageMeta.fieldGatherModifiers[field]);
    });
  }
  return Promise.resolve();
}

/**
 * Gather data into the request session.
 *
 * Hooks:
 *   pregather
 *
 * @param {Logger} logger Request-specific logger instance
 * @param {request} req Express request obejct
 * @param {response} res Express response object
 * @param {object} pageMeta Metadata of page being evalutated
 * @return {Promise} Promise (always resolves, unless hook intercepts)
 */
function doGather(logger, req, res, pageMeta) {
  /**
   * Store data before finally resolving the Promise.
   *
   * @returns {void}
   */
  function storeSessionData() {
    // Store gathered journey data, and reset any cached validation errors for
    // the page
    logger.debug(`Storing session data for ${req.journeyWaypointId}`);
    req.journeyData.setDataForPage(req.journeyWaypointId, req.body);
    req.journeyData.clearValidationErrorsForPage(req.journeyWaypointId);
    req.session.journeyData = req.journeyData.getData();
    req.session.journeyValidationErrors = req.journeyData.getValidationErrors();
  }

  // Promise
  return executeHook(logger, req, res, pageMeta, 'pregather')
    .then(doGatherDataModification(logger, req, pageMeta))
    .then(storeSessionData);
}

/**
 * Validate the gathered data.
 *
 * Hooks:
 *   prevalidate
 *   postvalidate
 *
 * @param {Logger} logger Request-specific logger instance
 * @param {request} req Express request
 * @param {response} res Express response object
 * @param {string} pageId ID of the page being validated
 * @param {object} pageMeta Metadata for page being evaluated
 * @return {Promise} Promise
 */
function doValidation(logger, req, res, pageId, pageMeta) {
  /**
   * Run validation process.
   *
   * @return {Promise} Promise
   */
  function runValidation() {
    let result;
    if (pageMeta && pageMeta.fieldValidators) {
      logger.debug(`Run validation for ${req.journeyWaypointId}`);
      result = Validation.processor(
        pageMeta.fieldValidators,
        req.journeyData.getDataForPage(pageId), {
          reduceErrors: true,
        },
      );
    } else {
      result = Promise.resolve();
    }
    return result;
  }

  // Promise
  return executeHook(logger, req, res, pageMeta, 'prevalidate')
    .then(runValidation)
    .then(executeHook.bind(null, logger, req, res, pageMeta, 'postvalidate'));
}

/**
 * Send user to the next waypoint in the journey.
 *
 * @param {Logger} logger Request-specific logger instance
 * @param {request} req Express request
 * @param {response} res Express response object
 * @param {string} mountUrl CASA mount URL
 * @param {object} pageMeta Metadata for page being evaluated
 * @param {UserJourney.Map} journey User journey to consult
 * @param {object} prePostWaypoints Contains waypoints the pre- & post- gather
 * @return {Promise} Promise
 */
function doRedirect(logger, req, res, mountUrl, pageMeta, journey, prePostWaypoints) {
  /**
   * Calculate the next waypoint in the journey.
   *
   * @return {string} Next waypoint ID
   */
  function calculateNextWaypoint() {
    let nextWaypoint;

    if (req.inEditMode) {
      // When in edit mode, the user should be redirected back to the 'review'
      // UI after submitting their update unless - due to the journey data
      // being altered - the waypoints along the journey have changed.
      // If the user hasn't yet reached the 'review' step, the 'journey'
      // middleware will ensure they are redirected back to the correct next
      // waypoint.
      nextWaypoint = 'review';
      prePostWaypoints.pre.every((el, i) => {
        if (typeof prePostWaypoints.post[i] === 'undefined') {
          return false;
        }
        nextWaypoint = prePostWaypoints.post[i];
        const same = el === prePostWaypoints.post[i];
        if (!same) {
          logger.info(`Journey altered (${el} -> ${prePostWaypoints.post[i]})`);
        }
        return same;
      });
    } else if (journey.containsWaypoint(req.journeyWaypointId)) {
      const waypoints = journey.traverse(
        req.journeyData.getData(),
        req.journeyData.getValidationErrors(),
      );
      const positionInJourney = Math.min(
        waypoints.indexOf(req.journeyWaypointId),
        waypoints.length - 2,
      );
      if (positionInJourney > -1) {
        nextWaypoint = waypoints[positionInJourney + 1];
      } else {
        nextWaypoint = req.url;
      }
      nextWaypoint = util.getPageIdFromUrl(nextWaypoint);
    } else {
      nextWaypoint = req.url;
    }

    return nextWaypoint;
  }

  /**
   * Perform the redirect.
   *
   * @param {string} waypoint Waypoint to redirect to
   * @return {void}
   */
  function redirect(waypoint) {
    // Because the hash fragment persists over a redirect, we reset it here.
    // Discovered that the session does not reliably persist when issuing a
    // redirect (seemed to only affect Windows), so here we save explicitly.
    req.session.save((err) => {
      if (err) {
        logger.error(err);
        res.status(500).send('500 Internal Server Error (session unsaved)');
      } else {
        const redirectUrl = `${mountUrl}/${waypoint}`.replace(/\/+/g, '/');
        logger.debug(`Redirect: ${req.journeyWaypointId} -> ${waypoint} (${redirectUrl})`);
        res.status(302).redirect(`${redirectUrl}#`);
      }
    });
  }

  // Promise
  return executeHook(logger, req, res, pageMeta, 'preredirect')
    .then(calculateNextWaypoint)
    .then(redirect);
}

/**
 * Render the page, complete with errors.
 *
 * @param {Logger} logger Request-specific logger instance
 * @param {request} req Express request
 * @param {response} res Express response object
 * @param {object} pageMeta Metadata for page being evaluated
 * @param  {object} errors Errors generated by the validation process
 * @return {void}
 */
function doRender(logger, req, res, pageMeta, errors) {
  return executeHook(logger, req, res, pageMeta, 'prerender').then(() => {
    if (typeof pageMeta.view !== 'string') {
      res.status(500).send('500 Internal Server Error (page template undefined)');
    } else {
      // Modify errors to conform to requirements of the new `error-summary`
      // Nunjucks macro, which is a basic array.
      // ref: https://github.com/alphagov/govuk-frontend/tree/master/package/components/error-summary
      // Ideally we'd have done this in Nunjucks, but doesn't appear possible.
      // We retain `formErrors` because other places need the errors keyed with
      // the field name.
      // The `f-` prefix on the error href reflects the use of an `f-` prefix on
      // the `id` attribute of each input field.
      // The first `focusSuffix` entry (if present) is appended to the
      // error link in order to highlight the specific input that is in error.
      const govukErrors = Object.keys(errors || {}).map(k => ({
        text: req.i18nTranslator.t(errors[k][0].summary),
        href: errors[k][0].fieldHref,
      }));

      res.render(pageMeta.view, {
        formData: req.body,
        formErrors: errors,
        formErrorsGovukArray: govukErrors,
        inEditMode: req.inEditMode,
      });
    }
  });
}

/**
 * Make an instance of the default POST route handler.
 *
 * @param {string} mountUrl CASA mount url
 * @param  {PageDirectory} pages Pages directory
 * @param  {UserJourney.Map} journey User journey map
 * @param  {bool} allowPageEdit Whether page edits are allowed
 * @return {function} The route handler
 */
module.exports = function routePagePost(mountUrl, pages, journey, allowPageEdit) {
  if (!(pages instanceof PageDirectory)) {
    throw new TypeError('Invalid type. Was expecting PageDirectory');
  }
  if (!(journey instanceof UserJourney.Map)) {
    throw new TypeError('Invalid type. Was expecting UserJourney.Map');
  }

  /**
   * Express route handler.
   *
   * @param {request} req HTTP request
   * @param {response} res HTTP response
   * @param {function} next Chain function
   * @returns {void}
   */
  /* eslint-disable-next-line no-unused-vars,no-inline-comments */
  return function routePagePostHandler(req, res, next) {
    // NOSONAR
    // Load meta
    const logger = loggerFunction('routes');
    logger.setSessionId(req.session.id);
    req.journeyWaypointId = req.journeyWaypointId
      || util.getPageIdFromUrl(req.url);
    const pageMeta = pages.getPageMeta(req.journeyWaypointId);

    // Are we in edit mode?
    if ('edit' in req.body && allowPageEdit) {
      req.inEditMode = true;
      delete req.body.edit;
    } else {
      req.inEditMode = false;
    }

    // Execute chain of events:
    // Gather -> Validate -> Redirect / Render errors
    // Take a snapshot of the waypoints involved in the user' journey before and
    // after the data has been gathered. This will allow us to see if the new
    // data changes the user's onward journey in any way.
    //
    // When in edit mode, we ignore any errors during pre-gathering traversal
    // because presumably the user must have, at some point, entered valid data
    // in order to reach the review page (and thus the editing mode). Edit mode
    // can be enabled at any time prior to reaching review (by adding `?edit` to
    // the URL), but this case will be handled by normal traversal.
    const preGatherWaypoints = journey.traverse(
      req.journeyData.getData(),
      req.inEditMode ? {} : req.journeyData.getValidationErrors(),
    );
    doGather(logger, req, res, pageMeta)
      .then(doValidation.bind(null, logger, req, res, req.journeyWaypointId, pageMeta))
      .then(() => {
        // Clear any cached validation errors that may exist on this page so
        // that traversals can work correctly
        req.journeyData.clearValidationErrorsForPage(req.journeyWaypointId);
        req.session.journeyValidationErrors = req.journeyData.getValidationErrors();
        return doRedirect(logger, req, res, mountUrl, pageMeta, journey, {
          pre: preGatherWaypoints,
          post: journey.traverse(req.journeyData.getData(), req.journeyData.getValidationErrors()),
        });
      })
      .catch((errors) => {
        // If it's a real error (i.e. thrown by interpreter rather than application)
        // we want to capture that earlier. Otherwise, treat as a validation error
        if (errors instanceof Error) {
          throw errors;
        }

        // Store validation results so they can be used during future traversals
        logger.debug('Storing validation errors on waypoint %s', req.journeyWaypointId);
        req.journeyData.setValidationErrorsForPage(req.journeyWaypointId, errors);
        req.session.journeyValidationErrors = req.journeyData.getValidationErrors();

        return doRender(logger, req, res, pageMeta, errors);
      })
      .catch((err) => {
        // Capture any other errors
        logger.debug(err.stack);
        res.status(500).send('500 Internal Server Error (render error)');
      });
  };
};
