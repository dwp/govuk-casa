const { isObjectWithKeys, isObjectType, normalizeHtmlObjectPath } = require('../../lib/Util.js');
const JourneyContext = require('../../lib/JourneyContext.js');

/**
 * Converts an array of functions to a nested callback, eg:
 * [                                  |   function nested(req, res, next) {-
 *   function a(req, res, next) {-    |     a(req, res, () => {-
 *     ...                            |       ...
 *     next();                        |       b(req, res, () => {-
 *   },                               |         ...
 *   function b(req, res, next) {-    |         c(req, res, () => {-
 *     ...                            |           ...
 *     next();                        |           next();
 *   },                               |         });
 *   function c(req, res, next) {-    |       })
 *     ...                            |     });
 *     next();                        |   }
 *   },                               |
 * ]                                  |.
 *
 * @param  {object} logger Request-specific Logger instance.
 * @param  {string} hookName Name of the hook being called.
 * @param  {string} waypointId ID of waypoint.
 * @param  {Array} hooks Array of middleware like functions.
 * @returns {Function} Nested function.
 */
function nestHooks(logger, hookName, waypointId, hooks) {
  return hooks.reduce((inital, hook, hookNumber) => {
    if (typeof hook === 'function') {
      return (req, res, next) => {
        inital(req, res, () => {
          logger.trace('Running %s hook %d for %s', hookName, hookNumber + 1, waypointId);
          hook(req, res, next);
        })
      }
    }
    return inital;
  }, (req, res, next) => next());
}

/**
 * Generic wrapper for executing one of the page hooks.
 *
 * The returned Promise will always resolve unless the hook function ends the
 * response with something like `res.send()`.
 *
 * @param  {object} logger Request-specific Logger instance.
 * @param  {object} req Express request.
 * @param  {object} res Express response.
 * @param  {object} pageMeta Metadata of page being processed.
 * @param  {string} hookName Name of hook to execute.
 * @returns {Promise} Promise.
 */
function executeHook(logger, req = {}, res = {}, pageMeta = {}, hookName = '') {
  return new Promise((resolve, reject) => {
    const hooks = pageMeta && pageMeta.hooks ? pageMeta.hooks : Object.create(null);
    const { journeyWaypointId } = req.casa || Object.create(null);
    if (Array.isArray(hooks[hookName])) {
      const nestedHooks = nestHooks(logger, hookName, req.casa.journeyWaypointId, hooks[hookName]);
      // Will not resolve if any hook executes `res.send()`
      logger.trace('Running nested %s hooks for %s', hookName, journeyWaypointId);
      nestedHooks(req, res, resolve);
    } else if (typeof hooks[hookName] === 'function') {
      logger.trace('Run %s hook for %s', hookName, journeyWaypointId);
      hooks[hookName](req, res, (err) => {
        // Will not resolve if hook executes `res.send()`
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    } else {
      logger.trace('No %s hook for %s', hookName, journeyWaypointId);
      resolve();
    }
  });
}

/**
 * Apply the `sanitise()` method of each validator rule defined in the
 * fieldValidator. The output of each sanitisation is passed as input to the
 * next.
 *
 * `context` contains the `fieldName`, `waypointId` and `journeyContext`.
 *
 * @param {SimpleFieldValidatorConfig} fieldValidator Validator
 * @param {any} data Data to be sanitised
 * @param {any} context Data context
 * @returns {any} Sanitised data
 */
function applyValidatorSanitiser(fieldValidator, data, context) {
  // Apply each valdiator's `sanitise` method
  let sanitisedData = data;
  fieldValidator.validators.forEach((validatorObj) => {
    sanitisedData = validatorObj.sanitise(sanitisedData, context);
  });

  return sanitisedData;
}

/**
 * Extract the data that will be saved to session, removing data that does not
 * have an associated field validator.
 *
 * Where no validators are defined for the requested waypoint, we will store
 * nothing in the session.
 *
 * @param {object} logger Request-specific logger instance.
 * @param {object} pageMeta Page meta object.
 * @param {object} data Data to be pruned.
 * @param {JourneyContext} journeyContext Request's journey context.
 * @returns {object} The pruned data.
 * @throws {TypeError} When given invalid argument types.
 */
function extractSessionableData(
  logger,
  // pageWaypointId,
  // fieldValidators = {},
  pageMeta,
  data = {},
  journeyContext,
) {
  if (!isObjectWithKeys(logger, ['warn'])) {
    throw new TypeError('Expected logger to be a configured logging object');
  }

  if (!isObjectType(pageMeta)) {
    throw new TypeError('Expected pageMeta to be an object');
  }

  const { fieldValidators } = pageMeta;
  if (!isObjectWithKeys(fieldValidators)) {
    throw new TypeError('Expected pageMeta.fieldValidators to be an object');
  }

  if (!isObjectWithKeys(data)) {
    throw new TypeError('Expected data to be an object');
  }

  if (Object.keys(fieldValidators).length === 0) {
    logger.debug(
      'No field validators defined for "%s" waypoint. Will use an empty object.',
      pageMeta.id,
    );
    return Object.create(null);
  }

  // Prune data that does not have an associated field valdiator.
  // Conditional functions expect the gathered data to be available via a
  // JourneyContext instance. Therefore we need to create a duplicate of the
  // `journeyContext`, and bundle `data` into it.
  const journeyContextWrapper = JourneyContext.fromObject(journeyContext.toObject());
  journeyContextWrapper.setDataForPage(pageMeta, data);
  const prunedData = Object.create(null);
  Object.keys(fieldValidators).forEach((k) => {
    if (
      typeof data[k] !== 'undefined'
      && fieldValidators[k].condition({
        fieldName: normalizeHtmlObjectPath(k),
        waypointId: pageMeta.id,
        journeyContext: journeyContextWrapper,
      })
    ) {
      prunedData[k] = applyValidatorSanitiser(
        fieldValidators[k],
        data[k],
        {
          fieldName: normalizeHtmlObjectPath(k),
          waypointId: pageMeta.id,
          journeyContext: journeyContextWrapper,
        },
      );
    }
  });

  return prunedData;
}

/**
 * Run modifying functions against the specified field.
 *
 * @param {object} fieldValue Value to modify.
 * @param {Array | Function} gatherModifiers Either an array of functions or a single function.
 * @returns {any} Modified value.
 */
function runGatherModifiers(fieldValue, gatherModifiers = []) {
  const modifiers = Array.isArray(gatherModifiers) ? gatherModifiers : [gatherModifiers];

  let fValue = fieldValue;
  modifiers.forEach((m) => {
    fValue = typeof m === 'function' ? m({
      fieldValue: fValue,
    }) : fValue;
  });

  return fValue;
}

module.exports = {
  applyValidatorSanitiser,
  executeHook,
  extractSessionableData,
  nestHooks,
  runGatherModifiers,
};
