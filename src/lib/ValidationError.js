import lodash from 'lodash';

const { isPlainObject } = lodash; // CommonJS

const params = new WeakMap();

/**
 * @typedef {import('../casa').ValidateContext} ValidateContext
 */

/**
 * @typedef {import('../casa').ErrorMessageConfig} ErrorMessageConfig
 */

/**
 * @typedef {import('../casa').ErrorMessageConfigObject} ErrorMessageConfigObject
 */

/**
 * @class
 * @memberof module:@dwp/govuk-casa
 */
export default class ValidationError {
  /**
   * Make a ValidationError instance from a primitive object (or a function that
   * returns a primitive object) that is specific to the given journey context.
   * <br/><br/>
   *
   * In the case of `errorMsg` being a function, this will be called at runtime,
   * at the point that errors are generated within the `validate()`,
   * methods, and will be passed the `dataContext`.
   * <br/><br/>
   *
   * `dataContext` is an object containing the same data passed to all
   * validators' `validate()` methods. In the case of `errorMsg` being
   * a function, this data is passed to that function in order to help resolve to
   * an error message config object.
   *
   * @param {object} args Arguments
   * @param {ErrorMessageConfig} args.errorMsg Error message config to seed ValidationError
   * @param {ValidateContext} [args.dataContext={}] Data for error msg function
   * @returns {ValidationError} Error instance
   * @throws {TypeError} If errorMsg is not in a valid type
   */
  static make({ errorMsg, dataContext = {} }) {
    // Convert strings to the most basic object primitive
    if (typeof errorMsg === 'string') {
      return new ValidationError({
        summary: errorMsg,
        inline: errorMsg,
        focusSuffix: [],
      });
    }

    // No contextual changes applicable; return ValidationErorr made from the
    // original object
    if (isPlainObject(errorMsg)) {
      return new ValidationError(errorMsg);
    }

    // Use the user-defined function to generate an error primitive for the
    // given context
    if (typeof errorMsg === 'function') {
      return new ValidationError(errorMsg.call(null, { ...dataContext }));
    }

    // Core Error
    if (errorMsg instanceof Error) {
      return new ValidationError({
        summary: errorMsg.message,
        inline: errorMsg.message,
        focusSuffix: errorMsg.focusSuffix || [],
      });
    }

    // Unsupported
    throw new TypeError('errorMsg must be a string, Error, primitive object or function that generates a primitive object');
  }

  /**
   * Create a ValidationError.
   *
   * @param {string|ErrorMessageConfigObject} errorParam Error configuration
   */
  constructor(errorParam = {}) {
    if (!isPlainObject(errorParam) && typeof errorParam !== 'string') {
      throw new TypeError('Constructor requires a string or object');
    }
    const error = typeof errorParam === 'string' ? { summary: errorParam } : errorParam;

    // Store parameters for later use in applying contexts
    const originals = {
      summary: error.summary,
      // may be deprecated; summary and inline should always match
      inline: error.inline || error.summary,
      focusSuffix: error.focusSuffix || [],
      fieldKeySuffix: error.fieldKeySuffix || undefined,
      variables: error.variables || {},
      message: error.summary,
      field: error.field || undefined,
      fieldHref: error.fieldHref || undefined,
      validator: error.validator || undefined,
    };
    params.set(this, originals);

    // Duplicate parameters to make them available in public scope. These are
    // the values that will be readable, and reflect any context that may have
    // been applied
    Object.keys(originals).forEach((o) => {
      // ESLint disabled as `o` is an "own" property of `originals`, which is
      // dev-controlled
      /* eslint-disable security/detect-object-injection */
      Object.defineProperty(this, o, {
        value: originals[o],
        enumerable: true,
        writable: true,
      });
      /* eslint-enable security/detect-object-injection */
    });
  }

  /**
   * Modifies this instance to reflect the given validation context.
   *
   * @param {ValidateContext} context See structure above
   * @returns {ValidationError} Chain
   */
  withContext(context) {
    // Get original constructor parameters
    const originals = params.get(this);

    // Expand variables
    if (typeof originals.variables === 'function') {
      this.variables = originals.variables.call(this, context);
    }

    // Set field name
    if (context.fieldName) {
      let focusSuffix;
      let fieldHref = `#f-${context.fieldName}`;
      if (originals.fieldKeySuffix) {
        fieldHref += originals.fieldKeySuffix;
      } else if (originals.focusSuffix && originals.focusSuffix.length) {
        focusSuffix = Array.isArray(originals.focusSuffix)
          ? originals.focusSuffix
          : [originals.focusSuffix];
        fieldHref += focusSuffix[0];
      }

      this.field = context.fieldName + (originals.fieldKeySuffix || '');
      this.fieldHref = fieldHref;
      this.focusSuffix = focusSuffix || [];
    }

    // Set validator name
    this.validator = context.validator || undefined;

    return this;
  }
}
