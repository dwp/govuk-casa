import lodash from 'lodash';
import { isEmpty } from './utils.js';

const { isFunction } = lodash;

/**
 * @typedef {import('./index').JourneyContext} JourneyContext
 */

/**
 * @typedef {import('./index').Validator} Validator
 */

/**
 * @typedef {import('./index').ValidateFunction} ValidateFunction
 */

/**
 * @typedef {import('./index').ValidateContext} ValidateContext
 */

/**
 * @typedef {import('./index').ValidationError} ValidationError
 */

/**
 * @callback ProcessorFunction
 * @param {any} value Value to be processed
 * @returns {any}
 */

/**
 * @callback ConditionFunction
 * @param {Object} context Value to be processed
 * @param {string} context.fieldName Field name
 * @param {any} context.fieldValue Field value
 * @param {string} context.waypoint Waypoint
 * @param {string} context.waypointId [DEPRECATED] Waypoint (for backwards compatibility with v7)
 * @param {JourneyContext} journeyContext Journey Context
 * @returns {boolean} True if the validators should be run
 */

// Quick check to see if the field name corresponds to a non-primitive complex
// type. For example, `my_field[nested]`.
const reComplexType = /\[/;

const reInvalidName = /[^a-z0-9_.\-[\]]/i;

// This is never exposed via a public API, and instead users are encouraged to
// use the `field()` factory instead
export class PageField {
  /*
   * @type {string}
   */
  #name;

  /**
   * @type {ProcessorFunction[]}
   */
  #processors;

  /**
   * @type {ValidateFunction[]}
   */
  #validators;

  /**
   * @type {ConditionFunction[]}
   */
  #conditions;

  /**
   * @type {object}
   */
  #meta;

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
   * For complex fields, we need may need to drill into an object to extract the
   * value.
   *
   * @param {object} obj Object from which to extract the value
   * @returns {any} Value extracted from object
   * @throws {Error} When run on a complex field
   */
  getValue(obj = Object.create(null)) {
    if (!this.#meta.complex) {
      return obj[this.#name];
    }
    throw new Error('Not yet supporting complex field types');
  }

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
   * @param {ValidateFunction[]} items Validation functions
   * @returns {PageField | ValidateFunction[]} Chain or return all validators
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
   * @param {ProcessorFunction[]} items Processor functions
   * @returns {PageField | ProcessorFunction[]} Chain or return all processors
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
   * @param {ConditionFunction[]} items Condition functions
   * @returns {PageField | ConditionFunction[]} Chain or return all conditions
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
   * @param {ValidateContext} context Contextual information
   * @returns {ValidationError[]} Errors, or an empty array if all valid
   */
  runValidators(value, context) {
    // Skip validation if the field is empty and optional
    if (this.#meta.optional && isEmpty(value)) {
      return [];
    }

    let errors = [];
    for (let i = 0, l = this.#validators.length; i < l; i++) {
      // ESLint disabled as `i` is an integer
      /* eslint-disable security/detect-object-injection */
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

  /*
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
   * Apply all conditions to get the resulting boolean
   *
   * @param {object} params Parameters
   * @param {string} params.fieldValue Field value
   * @param {string} params.waypoint Waypoint
   * @param {object} params.journeyContext JourneyContext
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

  validator(validator) {
    return this.validators([validator]);
  }

  processor(processor) {
    return this.processors([processor]);
  }

  condition(condition) {
    return this.conditions([condition]);
  }

  if(...args) {
    return this.conditions(...args);
  }
}

// Factory for convenience
export default function field(...args) {
  return new PageField(...args);
}
