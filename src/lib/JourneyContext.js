/**
 * Represents the state of a user's journey through the Plan. It contains
 * information about:
 *
 * - Data gathered during the journey
 * - Validation errors on that data
 * - Navigation information about how the user got where they are.
 */
import { v4 as uuidv4, validate as uuidValidate } from 'uuid';
import lodash from 'lodash';
import ValidationError from './ValidationError.js';
import logger from './logger.js';
import { notProto } from './utils.js';

const {
  cloneDeep, isPlainObject, isObject, has, isEqual,
} = lodash; // CommonJS

const log = logger('lib:journey-context');

/**
 * @access private
 * @typedef {import('../casa').Page} Page
 */

/**
 * @access private
 * @typedef {import('../casa').ContextEventHandler} ContextEventHandler
 */

/**
 * @access private
 * @typedef {import('../casa').ContextEvent} ContextEvent
 */

/**
 * @access private
 * @typedef {import('express').Request} ExpressRequest
 */

export function validateObjectKey(key = '') {
  const keyLower = String.prototype.toLowerCase.call(key);
  if (keyLower === 'prototype' || keyLower === '__proto__' || keyLower === 'constructor') {
    throw new SyntaxError(`Invalid object key used, ${key}`);
  }
  return String(key);
}

/**
 * @memberof module:@dwp/govuk-casa
 */
export default class JourneyContext {
  // Private properties
  #data;

  #validation;

  #nav;

  #identity;

  #eventListeners;

  #eventListenerPreState;

  static DEFAULT_CONTEXT_ID = 'default';

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
    this.#data = data;
    this.#validation = validation;
    this.#nav = nav;
    this.#identity = identity;
    this.#eventListeners = [];
    this.#eventListenerPreState = null;
  }

  /**
   * Clone into an object that can be stringified.
   *
   * @returns {object} Plain object.
   */
  toObject() {
    return Object.assign(Object.create(null), {
      data: cloneDeep(this.#data),
      validation: cloneDeep(this.#validation),
      nav: cloneDeep(this.#nav),
      identity: cloneDeep(this.#identity),
    });
  }

  /**
   * Create a new JourneyContext using the plain object.
   *
   * @param {object} obj Object.
   * @param {object} obj.data Data
   * @param {object} obj.validation Validation state
   * @param {object} obj.nav Navigation meta
   * @param {object} obj.identity Identity meta
   * @returns {JourneyContext} Instance.
   */
  static fromObject({
    data = Object.create(null),
    validation = Object.create(null),
    nav = Object.create(null),
    identity = Object.create(null),
  } = {}) {
    // As we're constructing a JourneyContext from a plain JS object, we need to
    // ensure any validation errors are instances of ValidationError.
    const deserialisedValidation = Object.create(null);
    for (const [waypoint, errors] of Object.entries(validation)) {
      let dErrors = errors;

      if (Array.isArray(errors)) {
        dErrors = errors.map((e) => (e instanceof ValidationError ? e : new ValidationError(e)));
      }

      deserialisedValidation[notProto(waypoint)] = dErrors;
    }

    return new JourneyContext(data, deserialisedValidation, nav, identity);
  }

  get data() {
    return this.#data;
  }

  set data(value) {
    this.#data = value;
  }

  get validation() {
    return this.#validation;
  }

  get nav() {
    return this.#nav;
  }

  get identity() {
    return this.#identity;
  }

  /**
   * Get data context for a specific a specific page.
   *
   * @param  {string | Page} page Page waypoint ID, or Page object.
   * @returns {object} Page data.
   * @throws {TypeError} When page is invalid.
   */
  getDataForPage(page) {
    if (typeof page === 'string') {
      return this.#data[validateObjectKey(page)];
    }
    if (isPlainObject(page)) {
      return this.#data[validateObjectKey(page.waypoint)];
    }
    throw new TypeError(`Page must be a string or Page object. Got ${typeof page}`);
  }

  /**
   * Get all data.
   *
   * @returns {object} Page data
   */
  getData() {
    return this.#data;
  }

  /**
   * Overwrite the data context with a new object.
   *
   * @param {object} data Data that will overwrite all existing data.
   * @returns {JourneyContext} Chain.
   */
  setData(data) {
    this.#data = data;
    return this;
  }

  /**
   * Write field form data from a page HTML form, into the `data` model.
   *
   * @param {string | Page} page Page waypoint ID, or Page object
   * @param {object} webFormData Data to overwrite with
   * @returns {JourneyContext} Chain
   * @throws {TypeError} When page is invalid.
   */
  setDataForPage(page, webFormData) {
    if (typeof page === 'string') {
      this.#data[validateObjectKey(page)] = webFormData;
    } else if (isPlainObject(page)) {
      this.#data[validateObjectKey(page.waypoint)] = webFormData;
    } else {
      throw new TypeError(`Page must be a string or Page object. Got ${typeof page}`)
    }

    return this;
  }

  /**
   * Return validation errors for all pages.
   *
   * @returns {object} All page validation errors.
   */
  getValidationErrors() {
    return this.#validation;
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
    const { [pageId]: dummy, ...remaining } = this.#validation;
    this.#validation = { ...remaining };
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
    this.#validation[validateObjectKey(pageId)] = null;
    return this;
  }

  /**
   * Set validation errors for a page.
   *
   * @param {string} pageId Page ID.
   * @param {ValidationError[]} errors Errors
   * @returns {JourneyContext} Chain.
   * @throws {SyntaxError} When errors are invalid.
   */
  setValidationErrorsForPage(pageId, errors = []) {
    if (!Array.isArray(errors)) {
      throw new SyntaxError(`Errors must be an Array. Received ${Object.prototype.toString.call(errors)}`);
    }

    errors.forEach((error) => {
      if (!(error instanceof ValidationError)) {
        throw new SyntaxError('Field errors must be a ValidationError');
      }
    });

    this.#validation[validateObjectKey(pageId)] = errors;

    return this;
  }

  /**
   * Return the validation errors associated with the page's currently held data
   * context (if any).
   *
   * @param {string} pageId Page ID.
   * @returns {ValidationError[]} An array of errors
   */
  getValidationErrorsForPage(pageId) {
    return this.#validation[validateObjectKey(pageId)] ?? [];
  }

  /**
   * Same as `getValidationErrorsForPage()`, but the return value is
   * an object whose keys are the field names, and values are the list of errors
   * associated with that particular field.
   *
   * @param {string} pageId Page ID.
   * @returns {object} Object indexed by field names; values containing list of errors
   */
  getValidationErrorsForPageByField(pageId) {
    const errors = this.getValidationErrorsForPage(pageId);
    const obj = Object.create(null);

    // ESLint disabled as `i` is an integer
    /* eslint-disable security/detect-object-injection */
    for (let i = 0, l = errors.length; i < l; i++) {
      if (!obj[errors[i].field]) {
        obj[errors[i].field] = [];
      }
      obj[errors[i].field].push(errors[i]);
    }
    /* eslint-enable security/detect-object-injection */

    return obj;
  }

  /**
   * Determine whether the specified page has any errors in its validation
   * context.
   *
   * @param {string} pageId Page ID.
   * @returns {boolean} Result.
   */
  hasValidationErrorsForPage(pageId) {
    return this.#validation?.[validateObjectKey(pageId)]?.length > 0;
  }

  /**
   * Set language of the context.
   *
   * @param {string} language Language to set (ISO 639-1 2-letter code).
   * @returns {JourneyContext} Chain.
   */
  setNavigationLanguage(language = 'en') {
    this.#nav.language = language;
    return this;
  }

  /**
   * Convenience function to test if page is valid.
   *
   * @param {string} pageId Page ID.
   * @returns {boolean} True if the page is valid.
   */
  isPageValid(pageId) {
    return this.#validation[validateObjectKey(pageId)] === null;
  }

  /**
   * Remove information about these waypoints.
   *
   * @param {string[]} waypoints Waypoints to be removed
   */
  purge(waypoints = []) {
    const newData = Object.create(null);
    const newValidation = Object.create(null);
    const toKeep = Object.keys(this.data).filter((w) => !waypoints.includes(w));

    // ESLint disabled as `i` is an integer
    /* eslint-disable security/detect-object-injection */
    for (let i = 0, l = toKeep.length; i < l; i++) {
      newData[toKeep[i]] = this.#data[toKeep[i]];
      newValidation[toKeep[i]] = this.#validation[toKeep[i]];
    }
    /* eslint-enable security/detect-object-injection */

    this.#data = { ...newData };
    this.#validation = { ...newValidation };
  }

  /**
   * Remove validation state from these waypoints. This is useful to quickly
   * force the user to revisit some waypoints.
   *
   * @param {string[]} waypoints Waypoints to be invalidated
   * @returns {void}
   */
  invalidate(waypoints = []) {
    for (let i = 0, l = waypoints.length; i < l; i++) {
      // ESLint disabled as `i` is an integer
      /* eslint-disable-next-line security/detect-object-injection */
      this.removeValidationStateForPage(waypoints[i]);
    }
  }

  /**
   * Event listeners are transient. They are not stored in session, and generally
   * only apply for the current request.
   *
   * They also only act on a fixed snapshot of this context's state, which is
   * taken at the point of attaching the listeners (in the "data" middleware).
   * This is important because JourneyContext.putContext()` could be called many
   * times during a request, so the context will be constantly changing.
   *
   * @param {ContextEvent[]} events Event listeners
   * @returns {JourneyContext} Chain
   */
  addEventListeners(events) {
    this.#eventListeners = events;
    this.#eventListenerPreState = this.toObject();
    return this;
  }

  /**
   * Execute all listeners for the given event.
   *
   * @param {object} params Params
   * @param {string} params.event Event (waypoint-change | context-change)
   * @param {object} params.session Session
   * @returns {JourneyContext} Chain
   */
  applyEventListeners({ event, session }) {
    if (!this.#eventListeners.length) {
      return this;
    }

    const previousContext = JourneyContext.fromObject(this.#eventListenerPreState);
    const listeners = this.#eventListeners.filter((l) => l.event === event);

    // ESLint disabled as `listeners[i]` uses an integer key, and the other keys
    // are derived from the list of `listeners`, which are not manipulated at
    // runtime (only set by dev in code).
    /* eslint-disable security/detect-object-injection */
    for (let i = 0, l = listeners.length; i < l; i++) {
      const { waypoint, field, handler } = listeners[i];

      let logMessage;
      let runHandler = false;

      if (!waypoint && !field) {
        logMessage = 'Calling generic event handler';
        runHandler = true;
      } else if (waypoint && !field) {
        logMessage = `Calling waypoint-specific event handler on "${waypoint}"`;
        runHandler = previousContext.data?.[waypoint] !== undefined && !isEqual(
          this.data?.[waypoint],
          previousContext.data?.[waypoint],
        );
      } else if (waypoint && field) {
        logMessage = `Calling field-specific event handler on "${waypoint} : ${field}"`;
        runHandler = previousContext.data?.[waypoint]?.[field] !== undefined && !isEqual(
          this.data?.[waypoint]?.[field],
          previousContext.data?.[waypoint]?.[field],
        );
      }

      if (runHandler) {
        log.trace(logMessage);
        handler({ journeyContext: this, previousContext, session });
      }
    }
    /* eslint-enable security/detect-object-injection */

    return this;
  }

  /* ----------------------------------------------- session context handling */

  /**
   * Construct a new ephemeral JourneyContext instance with a unique ID.
   *
   * @returns {JourneyContext} Constructed JourneyContext instance
   */
  static createEphemeralContext() {
    return JourneyContext.fromObject({
      identity: {
        id: uuidv4(),
      },
    });
  }

  /**
   * Construct a new JourneyContext instance from another instance.
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
    newContextObj.identity.id = uuidv4();

    return JourneyContext.fromObject(newContextObj);
  }

  /**
   * Convenience method to determine if this is the default context.
   *
   * @returns {boolean} True if this is the "default" journey context
   */
  isDefault() {
    return this.#identity.id === JourneyContext.DEFAULT_CONTEXT_ID;
  }

  /**
   * Initialise session with an empty entry for the "default" context.
   *
   * @param {object} session Request session
   * @returns {void}
   */
  static initContextStore(session) {
    // For existing sessions that were created prior to `journeyContextList`
    // being remodelled as an array, we need to convert the "legacy" structure
    // into an equivalent array.
    if (isPlainObject(session?.journeyContextList)) {
      log.trace('Session context list already initialised as an object (legacy structure). Will convert from object to array.');
      /* eslint-disable-next-line no-param-reassign */
      session.journeyContextList = Object.entries(session.journeyContextList);
    }

    // Initialise new context list in the session
    if (!has(session, 'journeyContextList')) {
      log.trace('Initialising session with a default journey context list');
      /* eslint-disable-next-line no-param-reassign */
      session.journeyContextList = [];

      const defaultContext = new JourneyContext();
      defaultContext.identity.id = JourneyContext.DEFAULT_CONTEXT_ID;
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
    if (id === JourneyContext.DEFAULT_CONTEXT_ID) {
      return JourneyContext.DEFAULT_CONTEXT_ID;
    }

    if (typeof id !== 'string') {
      throw new TypeError('Context ID must be a string');
    } else if (!uuidValidate(id)) {
      throw new SyntaxError('Context ID is not in the correct uuid format');
    }

    return id;
  }

  /**
   * Retrieve the default Journey Context. This is just a convenient wrapper
   * around `getContextById()`.
   *
   * @param {object} session Request session
   * @returns {JourneyContext} The default Journey Context
   */
  static getDefaultContext(session) {
    return JourneyContext.getContextById(session, JourneyContext.DEFAULT_CONTEXT_ID);
  }

  /**
   * Lookup context from session using the ID.
   *
   * @param {object} session Request session
   * @param {string} id Context ID
   * @returns {JourneyContext} The discovered JourneyContext instance
   */
  static getContextById(session, id) {
    const list = new Map(session?.journeyContextList);
    if (list.has(id)) {
      // ESLint disabled as `id` has been verified as an "own" property
      /* eslint-disable-next-line security/detect-object-injection */
      return JourneyContext.fromObject(list.get(id));
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
      const list = new Map(session?.journeyContextList);
      const context = [...list.values()].find(
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
      const list = new Map(session?.journeyContextList);
      return [...list.values()].filter(
        (c) => (c.identity.tags?.includes(tag)),
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
    if (has(session, 'journeyContextList')) {
      return session.journeyContextList.map(([, contextObj]) => (
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
    if (!isObject(session)) {
      throw new TypeError('Session must be an object');
    } else if (!(context instanceof JourneyContext)) {
      throw new TypeError('Context must be a valid JourneyContext');
    } else if (context.identity.id === undefined) {
      throw new TypeError('Context must have an ID before storing in session');
    }

    // Initialise the session if necessary
    if (!has(session, 'journeyContextList')) {
      JourneyContext.initContextStore(session);
    }

    // Apply context events
    context.applyEventListeners({
      event: 'waypoint-change',
      session,
    });

    context.applyEventListeners({
      event: 'context-change',
      session,
    });

    const list = new Map(session.journeyContextList);
    list.set(context.identity.id, context.toObject());
    /* eslint-disable-next-line no-param-reassign */
    session.journeyContextList = [...list.entries()];
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

  /**
   * Remove context from session using the ID.
   *
   * @param {object} session Request session
   * @param {string} id Context ID
   * @returns {void}
   */
  static removeContextById(session, id) {
    const index = (session?.journeyContextList ?? []).findIndex(([contextId]) => contextId === id);
    if (index > -1) {
      session.journeyContextList.splice(index, 1);
    }
  }

  /**
   * Remove context from session using the name.
   *
   * @param {object} session Request session
   * @param {string} name Context name
   * @returns {void}
   */
  static removeContextByName(session, name) {
    JourneyContext.removeContext(
      session,
      JourneyContext.getContextByName(session, name),
    );
  }

  /**
   * Remove context from session using the tag.
   *
   * @param {object} session Request session
   * @param {string} tag Context tag
   * @returns {void}
   */
  static removeContextsByTag(session, tag) {
    JourneyContext.getContextsByTag(session, tag).forEach(
      (c) => JourneyContext.removeContext(session, c),
    );
  }

  /**
   * Remove call contexts.
   *
   * @param {object} session Request session
   * @returns {void}
   */
  static removeContexts(session) {
    JourneyContext.getContexts(session).forEach((c) => JourneyContext.removeContext(session, c));
  }

  /**
   * Extract the Journey Context referred to in the incoming request.
   *
   * This will look in `req.params`, `req.query` and
   * `req.body` for a `contextid` parameter, and use that
   * to load the correct Journey Context from the session.
   *
   * @param {ExpressRequest} req ExpressJS incoming request
   * @returns {JourneyContext} The Journey Context
   */
  static extractContextFromRequest(req) {
    JourneyContext.initContextStore(req.session);

    let contextId;
    if (has(req?.params, 'contextid')) {
      log.trace('Context ID found in req.params.contextid');
      contextId = String(req.params.contextid);
    } else if (has(req.query, 'contextid')) {
      log.trace('Context ID found in req.query.contextid');
      contextId = String(req.query.contextid);
    } else if (has(req?.body, 'contextid')) {
      log.trace('Context ID found in req.body.contextid');
      contextId = String(req.body.contextid);
    } else {
      log.trace('Context ID not specified or not found; will attempt to use default');
      contextId = JourneyContext.DEFAULT_CONTEXT_ID;
    }

    try {
      contextId = JourneyContext.validateContextId(contextId);
      const context = JourneyContext.getContextById(req.session, contextId);
      if (!context) {
        throw (new Error(`Could not find a context with id, ${contextId}`));
      }
      return context;
    } catch (err) {
      log.debug(err.message);
      log.trace('Falling back to default context');
      return JourneyContext.getContextById(req.session, JourneyContext.DEFAULT_CONTEXT_ID);
    }
  }
}
