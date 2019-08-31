const util = require('../Util.js');
const rules = require('./rules/index.js');

const T_SIMPLE = 'simple';
const T_OBJECT = 'object';
const T_ARRAY_OBJECT = 'array_object';

/**
 * Converts a (potentially) deeply nested array of errors into a flat array.
 *
 * @param  {array} errors Array of errors
 * @return {array} The flatted array
 */
function flattenErrorArray(errors) {
  /**
   * Ensure error is defined in its object form
   * Validator functions may return errors as an Error, a string or an object
   * containing `inline` and `summary` attributes.
   *
   * @param {mixed} e Object to convert
   * @returns {Object} Objectified error
   */
  const objectify = (e = {}) => {
    if (e instanceof Error) {
      return {
        inline: e.message,
        summary: e.message,
        focusSuffix: e.focusSuffix || [],
      };
    }
    if (typeof e === 'string') {
      return {
        inline: e,
        summary: e,
        focusSuffix: [],
      };
    }
    if (Object.prototype.hasOwnProperty.call(e, 'summary') && !Object.prototype.hasOwnProperty.call(e, 'inline')) {
      e.inline = e.summary;
    }
    return e;
  };

  if (!Array.isArray(errors)) {
    return [objectify(errors)];
  }

  let flat = [];
  errors.forEach((e) => {
    if (Array.isArray(e)) {
      flat = flat.concat(flattenErrorArray(e));
    } else {
      flat.push(objectify(e));
    }
  });

  return flat;
}

/**
 * Add a validator object to the processing queue.
 *
 * @param  {array} queue Queue to which validators will be added
 * @param  {object} pageData Full page data from which data is extracted
 * @param  {string} field Field to validate (in square-brace notation)
 * @param  {object} validatorObj Validation attributes to apply
 * @return {void}
 */
/* eslint-disable-next-line consistent-return,require-jsdoc */
function queueValidator(queue, pageData, field, validatorObj) {
  // Do not queue if condition is not met
  if (validatorObj.condition(pageData, util.normalizeHtmlObjectPath(field))) {
    switch (validatorObj.type) {
    case T_SIMPLE:
      /* eslint-disable-next-line no-use-before-define */
      return queueSimpleValidator(queue, pageData, field, validatorObj);
    case T_OBJECT:
      /* eslint-disable-next-line no-use-before-define */
      return queueObjectValidator(queue, pageData, field, validatorObj);
    case T_ARRAY_OBJECT:
      /* eslint-disable-next-line no-use-before-define */
      return queueArrayObjectValidator(queue, pageData, field, validatorObj);
    default:
      throw new Error('Unknown or unspecified validator type');
    }
  }
}

/**
 * Add a Validation.SimpleField object to the processing queue.
 *
 * @param  {array} queue Queue to which validators will be added
 * @param  {object} pageData Full page data from which data is extracted
 * @param  {string} field Field to validate (in square-brace notation)
 * @param  {object} validatorObj Validation attributes to apply
 * @return {void}
 */
function queueSimpleValidator(queue, pageData, field, validatorObj) {
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
      pageData,
    };

    // Determine the name of the validator function so that we can pass it
    // back to the template for Anayltics purposes.
    const validatorName = validator.name.replace(/^.*?([a-z0-9_]+)$/i, '$1');

    // As well as the validator, we add an immediate `catch()` handler after
    // it in order to collect _all_ errors thrown by all validators. Otherise
    // `Promise.all()` would reject at the first failure and miss all other
    // errors.
    queue
      .push(validator(fieldValue, dataContext).catch((err) => {
        const errors = [];
        flattenErrorArray(err).forEach((error) => {
          let focusSuffix;
          let fieldHref = `#f-${util.normalizeHtmlObjectPath(field)}`;
          if (error.fieldKeySuffix) {
            fieldHref += error.fieldKeySuffix;
          } else if (error.focusSuffix && error.focusSuffix.length) {
            focusSuffix = Array.isArray(error.focusSuffix)
              ? error.focusSuffix
              : [error.focusSuffix];
            fieldHref += focusSuffix[0];
          }
          errors.push(Object.assign(Object.create(null), error, {
            field: util.normalizeHtmlObjectPath(field + (error.fieldKeySuffix || '')),
            fieldHref,
            focusSuffix: focusSuffix || [],
            validator: validatorName,
          }));
        });
        return Promise.resolve(errors);
      }));
  });
}

/**
 * Add a Validation.ObjectField object to the queue.
 *
 * @param  {array} queue Queue to which validators will be added
 * @param  {object} pageData Full page data from which data is extracted
 * @param  {string} field Field to validate (in square-brace notation)
 * @param  {object} validatorObj Validation attributes to apply
 * @return {void}
 */
function queueObjectValidator(queue, pageData, field, validatorObj) {
  // Add this validator's rules to the queue (if any)
  queueSimpleValidator(queue, pageData, field, validatorObj);

  // Queue the child validator objects
  Object.keys(validatorObj.children).forEach((childField) => {
    const child = validatorObj.children[childField];
    queueValidator(
      queue,
      pageData,
      util.objectPathString(field, childField),
      child,
    );
  });
}

/**
 * Add a Validation.ArrayObjectField object to the queue.
 *
 * @param  {array} queue Queue to which validators will be added
 * @param  {object} pageData Full page data from which data is extracted
 * @param  {string} field Field to validate (in square-brace notation)
 * @param  {object} validatorObj Validation attributes to apply
 * @return {void}
 */
function queueArrayObjectValidator(queue, pageData, field, validatorObj) {
  // Add this validator's rules to the queue (if any)
  queueSimpleValidator(queue, pageData, field, validatorObj);

  // The object at `pageData[field]` should be an array, indexed from 0. If it
  // is anything else, it is ignored.
  // Some caution is needed here because a non-/empty array will not trigger
  // any validations on the fields that _should_ be in objects in that array.
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
        pageData,
        util.objectPathString(`${field}[${index}]`, childField),
        child,
      );
    });
  });
}

/**
 * This is the core function that carries out validation on a page's data.
 *
 * All validators will be called with a single argument - the current value of
 * the field being validated. If a validator uses options, these are bound to
 * validator function using `Function.bind()`, and thus available as `this`
 * within the validator function.
 *
 * For objects/array fields, use square-braces syntax.
 *
 * Options:
 *   bool reduceErrors = Reduces each field to a single error (default false)
 *
 * @param {object} fieldValidators Validators indexed by field name
 * @param {object} userData Full data to which validation is applied
 * @param {object} options Options (see above)
 * @return {Promise} Promise
 */
module.exports = (fieldValidators = {}, userData = {}, options = {}) => {
  // Options
  const opts = { reduceErrors: false, ...options };

  // Build up a queue of Promises that will be executed on each field
  const validatorQueue = [];
  Object.keys(fieldValidators).forEach((field) => {
    queueValidator(validatorQueue, userData, field, fieldValidators[field]);
  });

  /**
   * Reduce the errors to include only the first error per field. Some fields
   * have multiple validation rules that may each be violated and thus result
   * in their own error messages, which can quickly stack up on larger pages.
   *
   * @param {object} errors All errors
   * @return {object} Reduced error list, indexed by field name
   */
  function reduceErrors(errors) {
    const reduced = Object.create(null);
    Object.keys(errors).forEach((field) => {
      reduced[field] = [errors[field][0]];
    });
    return reduced;
  }

  /**
   * Gather the array of errors generated by the validation process, into a flat
   * object indexed by the field names. This makes it easier to reference errors
   * in the front-end template.
   *
   * @param  {array} errorsList Array of errors
   * @return {Promise} Promise
   */
  function gatherErrors(errorsList) {
    let grouped = Object.create(null);
    errorsList.forEach((errors) => {
      if (Array.isArray(errors)) {
        errors.forEach((e) => {
          if (!grouped[e.field]) {
            grouped[e.field] = [];
          }
          grouped[e.field].push(e);
        });
      }
    });

    if (opts.reduceErrors) {
      grouped = reduceErrors(grouped);
    }

    return Object.keys(grouped).length
      ? Promise.reject(grouped)
      : Promise.resolve();
  }

  // Resulting Promise
  if (validatorQueue.length) {
    return Promise.all(validatorQueue).then(gatherErrors);
  }
  return Promise.resolve();
}
