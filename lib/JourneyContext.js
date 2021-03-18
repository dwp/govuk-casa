/**
 * Represents the state of a user's journey through the Plan. It contains
 * information about:
 *
 * - Data gathered during the journey
 * - Validation errors on that data
 * - Navigation information about how the user got where they are.
 */
const clonedeep = require('fast-copy');
const { v4: uuidv4, validate: uuidValidate } = require('uuid');
const { isObjectType, hasProp } = require('./Util.js');
const { DEFAULT_CONTEXT_ID } = require('./enums.js');

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
   * `identity` holds information that helps uniquely identify this context
   * among a group of contexts stored in the session.
   *
   * @param {object} data Entire journey data.
   * @param {object} validation Page errors (indexed by waypoint id).
   * @param {object} nav Navigation context.
   * @param {object} identity Some metadata for identifying this context among others.
   */
  constructor(data = {}, validation = {}, nav = {}, identity = {}) {
    privates.set(this, {
      data,
      validation,
      nav,
      identity,
    });
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
      identity: this.getIdentity(),
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
      hasProp(obj, 'data') ? obj.data : Object.create(null),
      hasProp(obj, 'validation') ? obj.validation : Object.create(null),
      hasProp(obj, 'nav') ? obj.nav : Object.create(null),
      hasProp(obj, 'identity') ? obj.identity : Object.create(null),
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

  get identity() {
    return this.getIdentity();
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

  /* ----------------------------------------------- session context handling */

  /**
   * Construct a new JourneyContext instance frmo another instance.
   *
   * @param {JourneyContext} context Context to copy from
   * @returns {JourneyContext} Constructed JourneyContext instance
   * @throws {TypeError} When context is not a valid type
   */
  static fromContext(context) {
    if (!(context instanceof JourneyContext)) {
      throw new TypeError('Source context must be a JourneyContext');
    }

    const newContextObj = context.toObject();
    newContextObj.identity = Object.assign(Object.create(null), { id: uuidv4() });
    return JourneyContext.fromObject(newContextObj);
  }

  /**
   * Get identity information. Returns an object:
   * {
   *   id: <string>,         // uuid | "default" | default undefined
   *   name: <string>,       // default undefined
   *   tags: <array<string>> // default undefined
   * }
   *
   * @returns {object} Identity object (see above)
   */
  getIdentity() {
    return privates.get(this).identity;
  }

  /**
   * Convenience method to determine if this is the default context.
   *
   * @returns {boolean} True if this is the "default" journey context
   */
  isDefault() {
    return this.getIdentity().id === DEFAULT_CONTEXT_ID;
  }

  /**
   * Initialise session with an empty entry for the "default" context.
   *
   * @param {object} session Request session
   * @returns {void}
   */
  static initContextStore(session) {
    if (!hasProp(session, 'journeyContextList')) {
      /* eslint-disable-next-line no-param-reassign */
      session.journeyContextList = Object.create(null);

      const defaultContext = new JourneyContext();
      defaultContext.identity.id = DEFAULT_CONTEXT_ID;
      JourneyContext.putContext(session, defaultContext);
    }
  }

  /**
   * Validate the format of a context ID, i.e. "default" or a uuid
   * eg 00000000-0000-0000-0000-000000000000
   * eg 123e4567-e89b-12d3-a456-426614174000
   *
   * @param {string} id Context ID
   * @returns {string} Original ID if it's valid
   * @throws {TypeError} When id is not a valid type
   * @throws {SyntaxError} When id is not a valid uuid format
   */
  static validateContextId(id) {
    if (id === DEFAULT_CONTEXT_ID) {
      return DEFAULT_CONTEXT_ID;
    }

    if (typeof id !== 'string') {
      throw new TypeError('Context ID must be a string');
    } else if (!uuidValidate(id)) {
      throw new SyntaxError('Context ID is not in the correct uuid format');
    }

    return id;
  }

  /**
   * Lookup context from session using the ID.
   *
   * @param {object} session Request session
   * @param {string} id Context ID
   * @returns {JourneyContext} The discovered JourneyContext instance
   */
  static getContextById(session, id) {
    if (session && hasProp(session.journeyContextList, id)) {
      return JourneyContext.fromObject(session.journeyContextList[id]);
    }

    return undefined;
  }

  /**
   * Lookup context from session using the name.
   *
   * @param {object} session Request session
   * @param {string} name Context name
   * @returns {JourneyContext} The discovered JourneyContext instance
   */
  static getContextByName(session, name) {
    if (session) {
      const context = Object.values(session.journeyContextList).find(
        (c) => (c.identity.name === name),
      );
      if (context) {
        return JourneyContext.fromObject(context);
      }
    }

    return undefined;
  }

  /**
   * Lookup contexts from session using the tag.
   *
   * @param {object} session Request session
   * @param {string} tag Context tag
   * @returns {Array<JourneyContext>} The discovered JourneyContext instance
   */
  static getContextsByTag(session, tag) {
    if (session) {
      return Object.values(session.journeyContextList).filter(
        (c) => (c.identity.tags.includes(tag)),
      ).map((c) => (JourneyContext.fromObject(c)));
    }

    return undefined;
  }

  /**
   * Return all contexts currently stored in the session.
   *
   * @param {object} session Request session
   * @returns {Array} Array of contexts
   */
  static getContexts(session) {
    if (hasProp(session, 'journeyContextList')) {
      return Object.values(session.journeyContextList).map((contextObj) => (
        JourneyContext.fromObject(contextObj)
      ));
    }

    return [];
  }

  /**
   * Put context back into the session store.
   *
   * @param {object} session Request session
   * @param {JourneyContext} context Context
   * @returns {void}
   * @throws {TypeError} When isession is not a valid type, or context has no ID
   */
  static putContext(session, context) {
    if (!isObjectType(session)) {
      throw new TypeError('Session must be an object');
    } else if (!(context instanceof JourneyContext)) {
      throw new TypeError('Context must be an valid JourneyContext');
    } else if (context.identity.id === undefined) {
      throw new TypeError('Context must have an ID before storing in session');
    }

    // Initialise the session if necessary
    if (!hasProp(session, 'journeyContextList')) {
      JourneyContext.initContextStore(session);
    }

    /* eslint-disable-next-line no-param-reassign */
    session.journeyContextList[context.identity.id] = context.toObject();

    // // Update the "active context" reference in the session, if it is the one
    // // being updated.
    // if (
    //   hasProp(session, 'journeyContext')
    //   && context.identity.id === session.journeyContext.identity.id
    // ) {
    //   session.journeyContext = session.journeyContextList[context.identity.id];
    // }
  }

  /**
   * Remove a context from the session store.
   *
   * @param {object} session Request session
   * @param {JourneyContext} context Context
   * @returns {void}
   */
  static removeContext(session, context) {
    if (context instanceof JourneyContext) {
      JourneyContext.removeContextById(session, context.identity.id);
    }
  }

  static removeContextById(session, id) {
    if (session && hasProp(session.journeyContextList, id)) {
      /* eslint-disable-next-line no-param-reassign */
      delete session.journeyContextList[id];
    }
  }

  static removeContextByName(session, name) {
    JourneyContext.removeContext(
      session,
      JourneyContext.getContextByName(session, name),
    );
  }

  static removeContextsByTag(session, tag) {
    JourneyContext.getContextsByTag(session, tag).forEach(
      (c) => JourneyContext.removeContext(session, c),
    );
  }

  static removeContexts(session) {
    JourneyContext.getContexts(session).forEach((c) => JourneyContext.removeContext(session, c));
  }
}

module.exports = JourneyContext;
