import lodash from 'lodash';
import { isEmpty } from './utils.js';

const { isFunction } = lodash;

/**
 * @access private
 * @typedef {import('./index').JourneyContext} JourneyContext
 */

/**
 * @access private
 * @typedef {import('../casa').Validator} Validator
 */

/**
 * @access private
 * @typedef {import('../casa').ValidateContext} ValidateContext
 */

/**
 * @access private
 * @typedef {import('../casa').ValidatorConditionFunction} ValidatorConditionFunction
 */

/**
 * @access private
 * @typedef {import('../casa').FieldProcessorFunction} FieldProcessorFunction
 */

/**
 * @access private
 * @typedef {import('./index').ValidationError} ValidationError
 */

// Quick check to see if the field name corresponds to a non-primitive complex
// type. For example, `my_field[nested]`.
const reComplexType = /\[/;

const reInvalidName = /[^a-z0-9_.\-[\]]/i;

/**
 * This class is not exposed via the public API. Instances should instead be
 * instantiated through the `field()` factory function.
 *
 * @class
 */
export class PageField {
  /**
   * @type {string}
   */
  #name;

  /**
   * @type {FieldProcessorFunction[]}
   */
  #processors;

  /**
   * @type {Validator[]}
   */
  #validators;

  /**
   * @type {ValidatorConditionFunction[]}
   */
  #conditions;

  /**
   * @type {object}
   */
  #meta;

  /**
   * Create a field.
   *
   * @param {string} name Field name
   * @param {object} opts Options
   * @param {boolean} [opts.optional=false] Whether this field is optional
   * @param {boolean} [opts.persist=true] Whether this field will persist in `req.body`
   */
  constructor(name, { optional = false, persist = true } = Object.create(null)) {
    if (!name) {
      throw new SyntaxError('A name for this field is required, i.e. "field(\'myField\')".');
    } else if (reInvalidName.test(String(name))) {
      throw new SyntaxError(`Field '${String(name)}' name contains invalid characters.`);
    }

    this.#name = String(name);
    this.#validators = [];
    this.#processors = [];
    this.#conditions = [];

    this.#meta = {
      optional,
      persist,
      complex: reComplexType.test(name),
    };
  }

  /**
   * Extract this field's value from the given object.
   *
   * For complex fields, we may need to drill into an object to extract the
   * value.
   *
   * @param {object} obj Object from which to extract the value
   * @returns {any} Value extracted from object
   * @throws {Error} When run on a complex field (not yet supported)
   */
  getValue(obj = Object.create(null)) {
    if (!this.#meta.complex) {
      return obj[this.#name];
    }
    throw new Error('Not yet supporting complex field types');
  }

  /**
   * Store this field's value in the given object, using its name as the key.
   *
   * @param {object} obj Object from which to extract the value
   * @param {any} value Value to be stored
   * @returns {any} Value extracted from object
   * @throws {Error} When run on a complex field (not yet supported)
   */
  putValue(obj = Object.create(null), value = undefined) {
    if (!this.#meta.complex) {
      /* eslint-disable-next-line no-param-reassign */
      obj[this.#name] = value;
      return this;
    }
    throw new Error('Not yet supporting complex field types');
  }

  /* -------------------------------------------------------------- configure */

  get name() {
    return this.#name;
  }

  get meta() {
    return this.#meta;
  }

  /**
   * Add/get value validators
   * Some validators will include a `sanitise()` method which will be run at the
   * same time as other "processors".
   *
   * @param {Validator[]} items Validation functions
   * @returns {PageField | Validator[]} Chain or return all validators
   */
  validators(items = []) {
    if (!items.length) {
      return this.#validators;
    }
    this.#validators = [...this.#validators, ...(items.flat())];
    return this;
  }

  /**
   * Add/get value pre-processors
   * This is most often used to sanitise values to a particular data type.
   *
   * @param {FieldProcessorFunction[]} items Processor functions
   * @returns {PageField | FieldProcessorFunction[]} Chain or return all processors
   */
  processors(items = []) {
    if (!items.length) {
      return this.#processors;
    }

    this.#processors = [...this.#processors, ...(items.flat())];
    return this;
  }

  /**
   * Add/get conditions
   * All conditions must be met in order for this field to be considered
   * "actionable".
   *
   * @param {ValidatorConditionFunction[]} items Condition functions
   * @returns {PageField | ValidatorConditionFunction[]} Chain or return all conditions
   */
  conditions(items = []) {
    if (!items.length) {
      return this.#conditions;
    }
    this.#conditions = [...this.#conditions, ...(items.flat())];
    return this;
  }

  /* ---------------------------------------------------------------- execute */

  /**
   * Run all validators and return array of errors, if applicable.
   *
   * @param {any} value Value to validate
   * @param {ValidateContext} context Contextual validation information
   * @returns {ValidationError[]} Errors, or an empty array if all valid
   */
  runValidators(value, context = Object.create(null)) {
    // Skip validation if the field is empty and optional
    if (this.#meta.optional && isEmpty(value)) {
      return [];
    }

    // Skip validation if conditions are not met
    // We duplicate value in context.fieldValue for historical reasons
    // @todo explain these historical reasons! And deprecate the need for
    // `value` altogether
    context.fieldValue = context.fieldValue ?? value;
    if (!this.testConditions(context)) {
      return [];
    }

    let errors = [];
    for (let i = 0, l = this.#validators.length; i < l; i++) {
      // ESLint disabled as `i` is an integer
      /* eslint-disable security/detect-object-injection */
      // TODO: Replace `value` with `context.fieldValue` here
      const fieldErrors = this.#validators[i].validate(value, context).map((e) => e.withContext({
        ...context,
        validator: this.#validators[i].name,
      }));
      /* eslint-enable security/detect-object-injection */

      errors = [
        ...errors,
        ...(fieldErrors ?? []),
      ];
    }

    return errors;
  }

  /**
   * Apply all the processors to the given value.
   *
   * @param {any} value Value to process
   * @returns {any} Processed value
   */
  applyProcessors(value) {
    let processedValue = value;

    // Some of the validators may have their own "sanitise()" methods. These
    // should be run before any other processors
    // ESLint disabled as `i` is an integer
    /* eslint-disable security/detect-object-injection */
    for (let i = 0, l = this.#validators.length; i < l; i++) {
      if (isFunction(this.#validators[i].sanitise)) {
        processedValue = this.#validators[i].sanitise(processedValue);
      }
    }
    /* eslint-enable security/detect-object-injection */

    for (let i = 0, l = this.#processors.length; i < l; i++) {
      // ESLint disabled as `i` is an integer
      /* eslint-disable-next-line security/detect-object-injection */
      processedValue = this.#processors[i](processedValue);
    }
    return processedValue;
  }

  /**
   * All conditions must return true to be considered a successful test.
   *
   * @param {ValidateContext} context Contextual validation information
   * @returns {boolean} True if all conditions pass
   */
  testConditions({ fieldValue, waypoint, journeyContext }) {
    const context = {
      fieldName: this.#name,
      fieldValue,
      waypoint,
      waypointId: waypoint, // [DEPRECATED] for backwards compatibility with v7
      journeyContext,
    };

    let result = true;
    for (let i = 0, l = this.#conditions.length; i < l; i++) {
      // ESLint disabled as `i` is an integer
      /* eslint-disable-next-line security/detect-object-injection */
      result = result && this.#conditions[i](context);
    }
    return result;
  }

  /* ---------------------------------------------------------------- aliases */

  /**
   * Add a single validator.
   *
   * @param {Validator} validator Validation function
   * @returns {PageField} Chain
   */
  validator(validator) {
    return this.validators([validator]);
  }

  /**
   * Add a single pre-processors
   *
   * @param {FieldProcessorFunction} processor Processor function
   * @returns {PageField} Chain
   */
  processor(processor) {
    return this.processors([processor]);
  }

  /**
   * Add a single condition.
   *
   * @param {ValidatorConditionFunction} condition Condition function
   * @returns {PageField} Chain
   */
  condition(condition) {
    return this.conditions([condition]);
  }

  /**
   * Alias for `conditions()`.
   *
   * @param {...ValidatorConditionFunction} args Condition functions
   * @returns {PageField} Chain
   */
  if(...args) {
    return this.conditions(...args);
  }
}

/**
 * Factory for creating PageField instances.
 *
 * @memberof module:@dwp/govuk-casa
 * @param {string} name Field name
 * @param {object} opts Options
 * @param {boolean} [opts.optional=false] Whether this field is optional
 * @param {boolean} [opts.persist=true] Whether this field will persist in `req.body`
 * @returns {PageField} A PageField
 */
export default function field(name, opts) {
  return new PageField(name, opts);
}
