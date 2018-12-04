/**
 * Validation logic common to 90% of the data passing through the application.
 *
 * These components will allow you to declaratively configure form validation.
 *
 * Some rule function can be configured for specific purposes via the use of
 * `Function.bind()`. See rule descriptions for details. Most rules support the
 * binding of an `errorMsg` object to allow customization of the resulting error
 * messages. Some rules may have different failure reasons and will support
 * more fine-grained error messages - see each rule for more info. Eg:
 *
 *  myNewRule = rules.strlen.bind({
 *    max: 30,
 *    min: 10,
 *    errorMsg: {
 *      inline: 'error:rule.myNewRule.inline',
 *      summary: 'error:rule.myNewRule..summary'
 *    }
 *  });
 *
 * `errorMsg` can also be a simple string if both the inline and summary
 * messages are to be the same.
 *
 */

const npath = require('path');
const fs = require('fs');
const util = require('./Util.js');

let RULES = {};

/* -------------------------------------------------------------- Field types */

/**
 * Examples for "simple", "object" and "array" fields:
 *
 *  let fields = {
 *    name: Validation.SimpleField([required]),
 *    dob: Validation.SimpleField([required, date], (d) => return d.name != ''),
 *    rep: Validation.ObjectField(vRep, conditionFunc),
 *    friends: Validation.ArrayObjectField(vFriend, conditionFunc)
 *  }
 *
 *  let vRep = {
 *    name: Validation.SimpleField([name]),
 *    value: Validation.SimpleField([repType])
 *  }
 *
 *  let vFriend = { // Defines validation for each instance in the array
 *    name: Validation.SimpleField([string]),
 *    address: Validation.SimpleField([address]),
 *  }
 *
 * If a validation function takes some options, you can use `Function.bind()`
 * to make them available to the validator function in `this`.
 *
 *  let fields = {
 *    budget: Validation.SimpleField([ range.bind({min:1000, max:2000}) ])
 *  }
 *
 * Use conditional functions to tell the processor whether or not to execute the
 * validation functions. For example, you may not want to run validations unless
 * a field is a certain value. Condition functions are passed the page's entire
 * form data object as the single argument. Conditional functions must be
 * synchronous.
 */
const T_SIMPLE = 'simple';
const T_OBJECT = 'object';
const T_ARRAY_OBJECT = 'array_object';

/**
 * A simple field.
 *
 * @param {array} validators Validation rules that must be satisfied
 * @param {Function|null} condition Condition to meet before validators are run
 * @return {object} Validation object suitable for processing
 */
function typeSimpleField(validators, condition) {
  return {
    type: T_SIMPLE,
    condition: condition || (() => true),
    validators: validators || [],
  };
}

/**
 * An object field. The defined `obj` is an object of fieldName:Field mappings.
 * For example:
 *  {
 *    "contactName": Validation.SimpleField([...]),
 *    "contactDob": Validation.SimpleField([...]),
 *    "contactAddress": Validation.ObjectField(addressObject, [...])}
 *  }
 *
 * @param {object} obj Object of fields that will be tested
 * @param {array|null} validators Validation rules that must be satisfied
 * @param {function|null} condition Condition to meet before validators are run
 * @return {object} Validation object suitable for processing
 */
function typeObjectField(obj, validators, condition) {
  return {
    type: T_OBJECT,
    condition: condition || (() => true),
    validators: validators || [],
    children: obj || {},
  };
}

/**
 * An array of objects field. This is identical to the `typeObjectField`
 * function, but the data against which it is tested is expected to be an array
 * of objects that match the structure of the `obj` defined here.
 *
 * @param {object} obj Object of fields that will be tested
 * @param {array} validators Validation rules that must be satisfied
 * @param {function|null} condition Condition to meet before validators are run
 * @return {object} Validation object suitable for processing
 */
function typeArrayObjectField(obj, validators, condition) {
  return {
    type: T_ARRAY_OBJECT,
    condition: condition || (() => true),
    validators: validators || [],
    children: obj || {},
  };
}

/* ---------------------------------------------------------------- Processor */

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
  const objectify = (e) => {
    if (e instanceof Error) {
      return {
        inline: e.message,
        summary: e.message,
      };
    } if (typeof e === 'string') {
      return {
        inline: e,
        summary: e,
      };
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
    validatorObj.validators.indexOf(RULES.optional) > -1
    && RULES.optional(fieldValue)
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
    if (validator === RULES.optional) {
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
          errors.push(Object.assign({
            field: util.normalizeHtmlObjectPath(field + (error.fieldSuffix || '')),
            validator: validatorName,
          }, error));
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
function processor(fieldValidators, userData, options) {
  // Options
  const opts = Object.assign({
    reduceErrors: false,
  }, options);

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
    const reduced = {};
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
    let grouped = {};
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

/* ------------------------------------------------------------------- module */

module.exports = (function libValidation() {
  // Load all core validation rules (from `./validation-rules`) into scope
  const rules = {};
  const rulesPath = npath.resolve(__dirname, 'validation-rules');

  fs.readdirSync(rulesPath).forEach((file) => {
    if (npath.extname(file) === '.js') {
      const ruleName = npath.basename(file, '.js');
      const rulePath = npath.resolve(rulesPath, file);
      /* eslint-disable-next-line global-require,import/no-dynamic-require */
      rules[ruleName] = require(rulePath);
    }
  });

  // This module-scoped reference to the rules is here to allow other functions
  // defined here to have access to the rules where needed (e.g. `optional` rule
  // is a special test case during validation processing)
  RULES = rules;

  return {
    // Field type constructors
    SimpleField: typeSimpleField,
    ObjectField: typeObjectField,
    ArrayObjectField: typeArrayObjectField,

    // Core validation processor
    processor,

    // Core rules
    rules,
  };
}());
