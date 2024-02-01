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
const reComplexType = /^([^[]+)\[([^\]]+)\]/;

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
   * @param {object} [opts] Options
   * @param {boolean} [opts.optional=false] Whether this field is optional
   * @param {boolean} [opts.persist=true] Whether this field will persist in `req.body`
   */
  constructor(name, { optional = false, persist = true } = Object.create(null)) {
    if (!name) {
      throw new SyntaxError('A name for this field is required, i.e. "field(\'myField\')".');
    }

    this.#name = undefined;
    this.#validators = [];
    this.#processors = [];
    this.#conditions = [];

    this.#meta = {
      optional,
      persist,
      complex: undefined,
      complexFieldName: undefined,
      complexFieldProperty: undefined,
    };

    // Apply name
    /* eslint-disable-next-line security/detect-non-literal-fs-filename */
    this.rename(name);
  }

  /**
   * Clone this field.
   *
   * @returns {PageField} Cloned field
   */
  clone() {
    const clone = new PageField(this.#name, {
      optional: this.#meta.optional,
      persist: this.#meta.persist,
    });

    if (this.getValidators()) {
      clone.validators(this.getValidators());
    }
    if (this.getConditions()) {
      clone.conditions(this.getConditions());
    }
    if (this.getProcessors()) {
      clone.processors(this.getProcessors());
    }

    return clone;
  }

  /**
   * Extract this field's value from the given object.
   *
   * For complex fields, we may need to drill into an object to extract the
   * value.
   *
   * @param {object} obj Object from which to extract the value
   * @returns {any} Value extracted from object
   */
  getValue(obj = Object.create(null)) {
    if (this.#meta.complex) {
      return obj[this.#meta.complexFieldName]?.[this.#meta.complexFieldProperty];
    }
    return obj[this.#name];
  }

  /**
   * Store this field's value in the given object, using its name as the key.
   *
   * For complex fields, the field object will be created if it does not yet
   * exist, before then storing the property within that object.
   *
   * @param {object} obj Object from which to extract the value
   * @param {any} value Value to be stored
   * @returns {any} Value extracted from object
   */
  putValue(obj = Object.create(null), value = undefined) {
    if (this.#meta.complex) {
      /* eslint-disable-next-line no-param-reassign */
      obj[this.#meta.complexFieldName] = {
        ...(obj[this.#meta.complexFieldName] ?? {}),
        [this.#meta.complexFieldProperty]: value,
      };
    } else {
      /* eslint-disable-next-line no-param-reassign */
      obj[this.#name] = value;
    }

    return this;
  }

  /* -------------------------------------------------------------- configure */

  get name() {
    return this.#name;
  }

  get meta() {
    return this.#meta;
  }

  /**
   * Rename this field.
   *
   * @param {string} name New name to be applied
   * @returns {PageField} Chain
   * @throws {SyntaxError} When the name is invalid in some way
   */
  rename(name) {
    if (reInvalidName.test(String(name))) {
      throw new SyntaxError(`Field '${String(name)}' name contains invalid characters.`);
    }

    // Complex names are only supported to one level deep. For example,
    // `field[prop]` is supported, whilst `field[prop][subprop]` is not. Throw
    // early to aid developer.
    const isComplex = reComplexType.test(name);
    if (isComplex && name.match(/\[/g).length > 1) {
      throw new SyntaxError('Complex field names are only supported to 1 property depth. E.g. a[b] is ok, a[b][c] is not');
    }

    this.#name = String(name);
    this.#meta.complex = isComplex;

    // Extract the field name and property from a complex type for later use
    if (isComplex) {
      const parts = name.match(reComplexType);
      [, this.#meta.complexFieldName, this.#meta.complexFieldProperty] = parts;
    }

    return this;
  }

  /**
   * Get validators
   *
   * @returns {Validator[]} A list containing all validators.
   */
  getValidators() {
    return this.#validators;
  }

  /**
   * Add value validators
   * Some validators will include a `sanitise()` method which will be run at the
   * same time as other "processors".
   *
   * @param {Validator[]} items Validation functions
   * @returns {PageField} Chain
   */
  validators(items = []) {
    if (!items.length) {
      throw new Error('Calling validators() to get all validators is no longer supported, please use getValidators()');
    }
    this.#validators = [...this.#validators, ...(items.flat())];
    return this;
  }

  /**
   * Get processors
   *
   * @returns {FieldProcessorFunction[]} A list containing all processors.
   */
  getProcessors() {
    return this.#processors;
  }

  /**
   * Add value pre-processors
   * This is most often used to sanitise values to a particular data type.
   *
   * @param {FieldProcessorFunction[]} items Processor functions
   * @returns {PageField} Chain
   */
  processors(items = []) {
    if (!items.length) {
      throw new Error('Calling processors() to get all processors is no longer supported, please use getProcessors()');
    }

    this.#processors = [...this.#processors, ...(items.flat())];
    return this;
  }

  /**
   * Get conditions
   *
   * @returns {ValidatorConditionFunction[]} A list containing all conditions.
   */
  getConditions() {
    return this.#conditions;
  }

  /**
   * Add conditions
   * All conditions must be met in order for this field to be considered
   * "actionable".
   *
   * @param {ValidatorConditionFunction[]} items Condition functions
   * @returns {PageField} Chain
   */
  conditions(items = []) {
    if (!items.length) {
      throw new Error('Calling conditions() to get all conditions is no longer supported, please use getConditions()');
    }
    this.#conditions = [...this.#conditions, ...(items.flat())];
    return this;
  }

  /* ---------------------------------------------------------------- execute */

  /**
   * Run all validators and return array of errors, if applicable.
   *
   * @param {ValidateContext} context Contextual validation information
   * @returns {ValidationError[]} Errors, or an empty array if all valid
   * @throws {TypeError} If validator does not return an array
   */
  runValidators(context = Object.create(null)) {
    // Skip validation if the field is empty and optional
    if (this.#meta.optional && isEmpty(context?.fieldValue)) {
      return [];
    }

    // Skip validation if conditions are not met
    if (!this.testConditions(context)) {
      return [];
    }

    let errors = [];
    for (let i = 0, l = this.#validators.length; i < l; i++) {
      // ESLint disabled as `i` is an integer
      /* eslint-disable security/detect-object-injection */
      // TODO: Replace `value` with `context.fieldValue` here
      let fieldErrors = this.#validators[i].validate(context.fieldValue, context)
      if (!Array.isArray(fieldErrors)) {
        // Friendly message for developer
        throw new TypeError(`The validator at index ${i} (name: ${this.#validators[i].name || 'unknown'}) for field '${this.#name}' did not return an array`);
      }

      fieldErrors = fieldErrors.map((e) => e.withContext({
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
    return this.conditions(args);
  }
}

/**
 * Factory for creating PageField instances.
 *
 * @memberof module:@dwp/govuk-casa
 * @param {string} name Field name
 * @param {object} [opts] Options
 * @param {boolean} [opts.optional=false] Whether this field is optional
 * @param {boolean} [opts.persist=true] Whether this field will persist in `req.body`
 * @returns {PageField} A PageField
 */
export default function field(name, opts) {
  return new PageField(name, opts);
}
