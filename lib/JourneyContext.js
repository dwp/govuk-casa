/**
 * Represents the state of a user's journey through the Plan. It contains
 * information about:
 *
 * - Data gathered during the journey
 * - Validation errors on that data
 * - Navigation information about how the user got where they are.
 */
const clonedeep = require('fast-copy').default;
const { isObjectType } = require('./Util.js');

const privates = new WeakMap();

class JourneyContext {
  /**
   * Constructor.
   *
   * `data` is the "single source of truth" for all data gathered during the
   * user's journey. This is referred to as the "canonical data model".
   *  Page-specific "views" of this data are generated at runtime in order to
   * populate/validate specific form fields.
   *
   * `validation` holds the results of form field validation carried out when
   * page forms are POSTed. These results are mapped directly to per-page,
   * per-field.
   *
   * `nav` holds information about the current navigation state. Currently this
   * comprises of the language in which the user is navigating the service.
   *
   * @param {object} data Entire journey data.
   * @param {object} validation Page errors (indexed by waypoint id).
   * @param {object} nav Navigation context.
   */
  constructor(data = {}, validation = {}, nav = {}) {
    privates.set(this, { data, validation, nav });
  }

  /**
   * Turn this instance into an object that can be stringified.
   *
   * @returns {object} Plain object.
   */
  toObject() {
    return Object.assign(Object.create(null), {
      data: this.getData(),
      validation: this.getValidationErrors(),
      nav: this.getNavigation(),
    });
  }

  /**
   * Create a new JourneyContext using the plain object.
   *
   * @param {object} obj Object.
   * @returns {JourneyContext} Instance.
   */
  static fromObject(obj = {}) {
    return new JourneyContext(
      Object.prototype.hasOwnProperty.call(obj, 'data') ? obj.data : Object.create(null),
      Object.prototype.hasOwnProperty.call(obj, 'validation') ? obj.validation : Object.create(null),
      Object.prototype.hasOwnProperty.call(obj, 'nav') ? obj.nav : Object.create(null),
    );
  }

  get data() {
    return this.getData();
  }

  get validation() {
    return this.getValidationErrors();
  }

  get nav() {
    return this.getNavigation();
  }

  /**
   * Return the covnerted data context.
   *
   * This is the "form-facing" view of data that contains the per-field map of
   * data. This is generated at call-time. It follows this structure:
   *
   * {
   *   "<waypoint-id>": { "<field-name>": <field-value>, "<field-name>": <field-value>, ... },
   *   "<waypoint-id>": { "<field-name>": <field-value>, "<field-name>": <field-value>, ... },
   *   ...
   * }
   *
   * @returns {object} Data context
   */
  getData() {
    return privates.get(this).data;
  }

  /**
   * Get data context for a specific a specific page.
   *
   * By default this will retrieve data by looking up an object with a key
   * matching the page's waypoint ID. However, when passing a `PageMeta`
   * instance, its `fieldReader()` method will be called to transform the
   * internal context data into a format suitable for populating an HTML form.
   *
   * @param  {string | PageMeta} page Page waypoint ID, or PageMeta object.
   * @returns {object} Page data.
   * @throws {TypeError} When page is invalid.
   */
  getDataForPage(page) {
    const priv = privates.get(this);

    if (typeof page === 'string') {
      return priv.data[page];
    }

    if (isObjectType(page)) {
      if (
        Object.prototype.hasOwnProperty.call(page, 'fieldReader')
        && typeof page.fieldReader === 'function'
      ) {
        return page.fieldReader({
          waypointId: page.id,
          contextData: clonedeep(priv.data),
        })
      }
      return priv.data[page.id];
    }

    throw new TypeError(`Page must be a string or PageMeta object. Got ${typeof page}`)
  }

  /**
   * Overwrite the data context with a new object.
   *
   * @param {object} data Data that will overwrite all existing data.
   * @returns {JourneyContext} Chain.
   */
  setData(data) {
    const priv = privates.get(this);
    priv.data = data;
    privates.set(this, priv);
    return this;
  }

  /**
   * Write field form data from a page HTML form, into the `data` model.
   *
   * By default this will store the data as-is, keyed against the page's
   * waypoint ID. However, when passing a `PageMeta` instance, its
   * `fieldWriter()` method will be called to transform the provided formData
   * before storing in `data`
   *
   * @param {string | PageMeta} page Page waypoint ID, or PageMeta object
   * @param {object} webFormData Data to overwrite with
   * @returns {JourneyContext} Chain
   * @throws {TypeError} When page is invalid.
   */
  setDataForPage(page, webFormData) {
    const priv = privates.get(this);

    if (typeof page === 'string') {
      priv.data[page] = webFormData;
    } else if (isObjectType(page)) {
      if (
        Object.prototype.hasOwnProperty.call(page, 'fieldWriter')
        && typeof page.fieldWriter === 'function'
      ) {
        priv.data = page.fieldWriter({
          waypointId: page.id,
          formData: webFormData,
          contextData: priv.data, // clone not required as we overwrite anyway
        });
      } else {
        priv.data[page.id] = webFormData;
      }
    } else {
      throw new TypeError(`Page must be a string or PageMeta object. Got ${typeof page}`)
    }

    privates.set(this, priv);
    return this;
  }

  /**
   * Return validation errors for all pages.
   *
   * @returns {object} All page validation errors.
   */
  getValidationErrors() {
    return privates.get(this).validation;
  }

  /**
   * Removes any validation state for the given page. Clearing validation state
   * completely will, by default, prevent onward traversal from this page. See
   * the traversal logic in Plan class.
   *
   * @param {string} pageId Page ID.
   * @returns {JourneyContext} Chain.
   */
  removeValidationStateForPage(pageId) {
    const priv = privates.get(this);
    delete priv.validation[pageId];
    privates.set(this, priv);
    return this;
  }

  /**
   * Clear any validation errors for the given page. This effectively declares
   * that this page has been successfully validated, and so can be traversed. If
   * you want to remove any knowledge of validation success/failure, use
   * `removeValidationStateForPage()` instead.
   *
   * @param {string} pageId Page ID.
   * @returns {JourneyContext} Chain.
   */
  clearValidationErrorsForPage(pageId) {
    const priv = privates.get(this);
    priv.validation[pageId] = null;
    privates.set(this, priv);
    return this;
  }

  /**
   * Set validation errors for a page.
   *
   * @param {string} pageId Page ID.
   * @param {object} errors Errors index by field name (as generated by Validation.processor).
   * @returns {JourneyContext} Chain.
   * @throws {SyntaxError} When errors are invalid.
   */
  setValidationErrorsForPage(pageId, errors = {}) {
    const priv = privates.get(this);

    if (!isObjectType(errors)) {
      throw new SyntaxError(`Errors must be an Object. Recieved ${Object.prototype.toString.call(errors)}`);
    }

    Object.keys(errors).forEach((k) => {
      if (!Array.isArray(errors[k])) {
        throw new SyntaxError('Field errors must be an array');
      }
    });

    priv.validation[pageId] = errors;

    privates.set(this, priv);
    return this;
  }

  /**
   * Return the validation errors associated with the page's currently held data
   * context (if any).
   *
   * @param {string} pageId Page ID.
   * @returns {object} An object of errors, indexed by field name.
   */
  getValidationErrorsForPage(pageId) {
    return privates.get(this).validation[pageId] || Object.create(null);
  }

  /**
   * Determine whether the specified page has any errors in its validation
   * context.
   *
   * @param {string} pageId Page ID.
   * @returns {boolean} Result.
   */
  hasValidationErrorsForPage(pageId) {
    return Object.keys(this.getValidationErrorsForPage(pageId)).length > 0;
  }

  /**
   * Return navigation state information, in the format:
   * {
   *   language: 'en',  // language code (ISO 639-1 2-letter code)
   * }
   *
   * @returns {object} Navigation state
   */
  getNavigation() {
    return privates.get(this).nav;
  }

  /**
   * Set language of the context.
   *
   * @param {string} language Language to set (ISO 639-1 2-letter code).
   * @returns {JourneyContext} Chain.
   */
  setNavigationLanguage(language = 'en') {
    const priv = privates.get(this);
    priv.nav.language = language;
    privates.set(this, priv);
    return this;
  }

  /**
   * Convenience function to test if page is valid.
   *
   * @param {string} pageId Page ID.
   * @returns {boolean} True if the page is valid.
   */
  isPageValid(pageId) {
    return privates.get(this).validation[pageId] === null;
  }
}

module.exports = JourneyContext;
