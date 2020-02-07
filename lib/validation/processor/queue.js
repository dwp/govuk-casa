const util = require('../../Util.js');
const ValidationError = require('../ValidationError.js');
const rules = require('../rules/index.js');
const flattenErrorArray = require('./flattenErrorArray.js');

const T_SIMPLE = 'simple';
const T_OBJECT = 'object';
const T_ARRAY_OBJECT = 'array_object';

/**
 * Add a validator object to the processing queue.
 *
 * @param  {array} queue Queue to which validators will be added
 * @param  {string} waypointId Waypoint under validation
 * @param  {object} journeyContext Full JourneyContext
 * @param  {string} field Field to validate (in square-brace notation)
 * @param  {object} validatorObj Validation attributes to apply
 * @return {void}
 */
/* eslint-disable-next-line consistent-return,require-jsdoc */
function queueValidator(queue, waypointId, journeyContext, field, validatorObj) {
  // Do not queue if condition is not met
  if (validatorObj.condition({
    fieldName: util.normalizeHtmlObjectPath(field),
    journeyContext,
    waypointId,
  })) {
    switch (validatorObj.type) {
    case T_SIMPLE:
      /* eslint-disable-next-line no-use-before-define */
      return queueSimpleValidator(queue, waypointId, journeyContext, field, validatorObj);
    case T_OBJECT:
      /* eslint-disable-next-line no-use-before-define */
      return queueObjectValidator(queue, waypointId, journeyContext, field, validatorObj);
    case T_ARRAY_OBJECT:
      /* eslint-disable-next-line no-use-before-define */
      return queueArrayObjectValidator(queue, waypointId, journeyContext, field, validatorObj);
    default:
      throw new Error('Unknown or unspecified validator type');
    }
  }
}

/**
 * Add a Validation.SimpleField object to the processing queue.
 *
 * @param  {array} queue Queue to which validators will be added
 * @param  {string} waypointId Waypoint under validation
 * @param  {object} journeyContext Full JourneyContext
 * @param  {string} field Field to validate (in square-brace notation)
 * @param  {object} validatorObj Validation attributes to apply
 * @return {void}
 */
function queueSimpleValidator(queue, waypointId, journeyContext, field, validatorObj) {
  const pageData = journeyContext.getDataForPage(waypointId);

  // For optional fields (i.e. one whose validation rules contains the
  // `optional` rule), first check if the field value is present before
  // queuing all other rules.
  const fieldValue = util.objectPathValue(pageData, field);
  if (
    validatorObj.validators.indexOf(rules.optional) > -1
    && rules.optional(fieldValue)
  ) {
    return;
  }

  validatorObj.validators.forEach((validator) => {
    // A more useful exception with reference to field name
    if (typeof validator !== 'function') {
      throw new Error(`Validator defined on '${field}'' is not a function`);
    }

    // Skip `optional` rule as it does not return a Promise, and has already
    // been evaluated above.
    if (validator === rules.optional) {
      return;
    }

    // Create context object which allows a validator to optionally looks at
    // other data within the page being validated
    const dataContext = {
      fieldName: field,
      journeyContext,
      waypointId,
    };

    // Determine the name of the validator function so that we can pass it
    // back to the template for Anayltics purposes.
    const validatorName = validator.name.replace(/^.*?([a-z0-9_]+)$/i, '$1');

    // As well as the validator, we add an immediate `catch()` handler after
    // it in order to collect _all_ errors thrown by all validators. Otherise
    // `Promise.all()` would reject at the first failure and miss all other
    // errors.
    queue.push(validator(fieldValue, dataContext).catch((validationError) => {
      let err = validationError;
      if (err instanceof Error) {
        err = ValidationError.make({ errorMsg: err });
      } else if (err === undefined) {
        err = ValidationError.make({ errorMsg: 'Unknown error' });
      }

      let errors;
      try {
        errors = flattenErrorArray(err);
      } catch (ex) {
        errors = [ValidationError.make({ errorMsg: ex })];
      }

      // Apply current context to each error
      errors.forEach((error) => error.withContext({ ...dataContext, validator: validatorName }));

      return Promise.resolve(errors);
    }));
  });
}

/**
 * Add a Validation.ObjectField object to the queue.
 *
 * @param  {array} queue Queue to which validators will be added
 * @param  {string} waypointId Waypoint under validation
 * @param  {object} journeyContext Full JourneyContext
 * @param  {string} field Field to validate (in square-brace notation)
 * @param  {object} validatorObj Validation attributes to apply
 * @return {void}
 */
function queueObjectValidator(queue, waypointId, journeyContext, field, validatorObj) {
  // Add this validator's rules to the queue (if any)
  queueSimpleValidator(queue, waypointId, journeyContext, field, validatorObj);

  // Queue the child validator objects
  Object.keys(validatorObj.children).forEach((childField) => {
    const child = validatorObj.children[childField];
    queueValidator(
      queue,
      waypointId,
      journeyContext,
      util.objectPathString(field, childField),
      child,
    );
  });
}

/**
 * Add a Validation.ArrayObjectField object to the queue.
 *
 * @param  {array} queue Queue to which validators will be added
 * @param  {string} waypointId Waypoint under validation
 * @param  {object} journeyContext Full JourneyContext
 * @param  {string} field Field to validate (in square-brace notation)
 * @param  {object} validatorObj Validation attributes to apply
 * @return {void}
 */
function queueArrayObjectValidator(queue, waypointId, journeyContext, field, validatorObj) {
  // Add this validator's rules to the queue (if any)
  queueSimpleValidator(queue, waypointId, journeyContext, field, validatorObj);

  // The object at `pageData[field]` should be an array, indexed from 0. If it
  // is anything else, it is ignored.
  // Some caution is needed here because a non-/empty array will not trigger
  // any validations on the fields that _should_ be in objects in that array.
  const pageData = journeyContext.getDataForPage(waypointId);
  let arrayObj = util.objectPathValue(pageData, util.objectPathString(field));
  if (!Array.isArray(arrayObj)) {
    arrayObj = [];
  }

  // Cycle through each element in the array and add all validators for each
  // one.
  arrayObj.forEach((obj, index) => {
    Object.keys(validatorObj.children).forEach((childField) => {
      const child = validatorObj.children[childField];
      queueValidator(
        queue,
        waypointId,
        journeyContext,
        util.objectPathString(`${field}[${index}]`, childField),
        child,
      );
    });
  });
}

module.exports = {
  queueValidator,
  queueSimpleValidator,
  queueObjectValidator,
  queueArrayObjectValidator,
};
