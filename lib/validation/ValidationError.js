const util = require('../Util.js');

const params = new WeakMap();

class ValidationError {
  /**
   * Make a ValidationError instance from a primitive object (or a function that
   * returns a primitive object) that is specific to the given journey context.
   *
   * The returned `error` (or the function that returns the equivalent) must
   * match the structure required by the ValidationError constructor.
   *
   * `errorMsg` can be one of these formats:
   *   String => 'common:errors.my-error-message'
   *   Object => (see constructor argument for structure of this object)
   *   Function => Function returns object suitable for constructor (see example below)
   *   Error => A JavaScript error. It's `message` will be used as the error
   *
   * `dataContext` is an object containing the same data passed to all validator
   * functions, and contains:
   *   waypointId => The current waypoint being requested
   *   fieldName => Name of the field being validated
   *   journeyContext => The full JourneyContext of the current request
   *
   * Example function signature that can be used for `errorMsg`:
   *   ({ waypointId, fieldName, journeyContext }) => ({
   *     summary: 'my-waypoint:some.key.to.say.hello',
   *     variables: {
   *       name: journeyContext.getDataForPage(waypointId).name,
   *     }
   *   });
   *
   * @param {object} args See args above
   * @returns {object} Primitive error matching structure above
   */
  static make({ errorMsg, dataContext }) {
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
    if (Object.prototype.toString.call(errorMsg) === '[object Object]') {
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
   * `error` may be a simple string, in which case that string reppresents the
   * error mesaage (equivalent to `error.summary` in the structure below).
   *
   * `error`, when passed as an object, must match this structure:
   *
   * {
   *   summary: "",         // required
   *   inline: "",          // optional, may be deprecated in future
   *   focusSuffix: "",     // optional
   *   fieldKeySuffix: "",  // optional
   *   variables: {         // optional
   *     myVariable: 'a value'
   *   }
   * }
   *
   * @param {object|string} errorParam See object structure above
   */
  constructor(errorParam = {}) {
    if (Object.prototype.toString.call(errorParam) !== '[object Object]' && typeof errorParam !== 'string') {
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
      Object.defineProperty(this, o, {
        value: originals[o],
        enumerable: true,
        writable: true,
      });
    });
  }

  /**
   * Modifies the error to reflect the given context.
   *
   * `context` is an object containing the following attributes
   * string waypointId
   * string fieldName
   * JourneyContext journeyContext
   *
   * @param {object} context See structure above
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
      let fieldHref = `#f-${util.normalizeHtmlObjectPath(context.fieldName)}`;
      if (originals.fieldKeySuffix) {
        fieldHref += originals.fieldKeySuffix;
      } else if (originals.focusSuffix && originals.focusSuffix.length) {
        focusSuffix = Array.isArray(originals.focusSuffix)
          ? originals.focusSuffix
          : [originals.focusSuffix];
        fieldHref += focusSuffix[0];
      }

      this.field = util.normalizeHtmlObjectPath(context.fieldName + (originals.fieldKeySuffix || ''));
      this.fieldHref = fieldHref;
      this.focusSuffix = focusSuffix || [];
    }

    // Set validator name
    this.validator = context.validator || undefined;

    return this;
  }
}

module.exports = ValidationError;
