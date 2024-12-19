/**
 * Represents the state of a user's journey through the Plan. It contains
 * information about:
 *
 * - Data gathered during the journey
 * - Validation errors on that data
 * - Navigation information about how the user got where they are.
 */
import lodash from "lodash";
import rfdc from "rfdc";
import ValidationError from "./ValidationError.js";
import logger from "./logger.js";
import { notProto } from "./utils.js";
import { uuid as uuidGenerator } from "./context-id-generators.js";

const { isPlainObject, isObject, isEqual } = lodash; // CommonJS

const log = logger("lib:journey-context");

const uuid = uuidGenerator();

const clone = rfdc({ proto: false });

/**
 * @typedef {import("../casa").ContextEventUserInfo} ContextEventUserInfo
 * @access private
 */

/**
 * @typedef {import("../casa").Page} Page
 * @access private
 */

/**
 * @typedef {import("../casa").ContextEventHandler} ContextEventHandler
 * @access private
 */

/**
 * @typedef {import("../casa").ContextEvent} ContextEvent
 * @access private
 */

/**
 * @typedef {import("../casa").JourneyContextObject} JourneyContextObject
 * @access private
 */

/**
 * @typedef {import("express").Request} ExpressRequest
 * @access private
 */

/**
 * @param {any} key Object key to validate
 * @returns {string} Validated key
 */
export function validateObjectKey(key = "") {
  const keyLower = String.prototype.toLowerCase.call(key);
  if (
    keyLower === "prototype" ||
    keyLower === "__proto__" ||
    keyLower === "constructor"
  ) {
    throw new SyntaxError(`Invalid object key used, ${key}`);
  }
  return String(key);
}

/** @memberof module:@dwp/govuk-casa */
export default class JourneyContext {
  // Private properties
  #data;

  #validation;

  #nav;

  #identity;

  #eventListeners;

  #eventListenerPreState;

  static DEFAULT_CONTEXT_ID = "default";

  /** @type {symbol} */
  static ID_GENERATOR_REQ_LOG = Symbol("generatedContextIds");

  /** @type {symbol} */
  static ID_GENERATOR_REQ_KEY = Symbol("generateContextId");

  /**
   * Constructor.
   *
   * `data` is the "single source of truth" for all data gathered during the
   * user's journey. This is referred to as the "canonical data model".
   * Page-specific "views" of this data are generated at runtime in order to
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
   * @param {Record<string, any>} data Entire journey data.
   * @param {object} validation Page errors (indexed by waypoint id).
   * @param {object} nav Navigation context.
   * @param {object} identity Some metadata for identifying this context among
   *   others.
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
   * @returns {JourneyContextObject} Plain object.
   */
  toObject() {
    return Object.assign(Object.create(null), {
      data: clone(this.#data),
      validation: clone(this.#validation),
      nav: clone(this.#nav),
      identity: clone(this.#identity),
    });
  }

  /**
   * Create a new JourneyContext using the plain object.
   *
   * @param {JourneyContextObject} obj Object.
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
        dErrors = errors.map((e) =>
          e instanceof ValidationError ? e : new ValidationError(e),
        );
      }

      deserialisedValidation[notProto(waypoint)] = dErrors;
    }

    return new JourneyContext(data, deserialisedValidation, nav, identity);
  }

  configureFromObject(object) {
    const source = JourneyContext.fromObject(object);
    this.#data = source.data;
    this.#validation = source.validation;
    this.#nav = source.nav;
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
   * @param {string | Page} page Page waypoint ID, or Page object.
   * @returns {object} Page data.
   * @throws {TypeError} When page is invalid.
   */
  getDataForPage(page) {
    if (typeof page === "string") {
      return this.#data[validateObjectKey(page)];
    }
    if (isPlainObject(page)) {
      return this.#data[validateObjectKey(page.waypoint)];
    }
    throw new TypeError(
      `Page must be a string or Page object. Got ${typeof page}`,
    );
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
    if (typeof page === "string") {
      this.#data[validateObjectKey(page)] = webFormData;
    } else if (isPlainObject(page)) {
      this.#data[validateObjectKey(page.waypoint)] = webFormData;
    } else {
      throw new TypeError(
        `Page must be a string or Page object. Got ${typeof page}`,
      );
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
    /* eslint-disable-next-line sonarjs/no-unused-vars,no-unused-vars */
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
      throw new SyntaxError(
        `Errors must be an Array. Received ${Object.prototype.toString.call(errors)}`,
      );
    }

    for (const error of errors) {
      if (!(error instanceof ValidationError)) {
        throw new SyntaxError("Field errors must be a ValidationError");
      }
    }

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
   * Same as `getValidationErrorsForPage()`, but the return value is an object
   * whose keys are the field names, and values are the list of errors
   * associated with that particular field.
   *
   * @param {string} pageId Page ID.
   * @returns {object} Object indexed by field names; values containing list of
   *   errors
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
  setNavigationLanguage(language = "en") {
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
    const toKeep = Object.keys(this.#data).filter(
      (w) => !waypoints.includes(w),
    );

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
   * Event listeners are transient. They are not stored in session, and
   * generally only apply for the current request.
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
   * The `userInfo` parameter is simply passed straight through to the event
   * listeners.
   *
   * @param {object} params Params
   * @param {string} params.event Event (waypoint-change | context-change)
   * @param {object} params.session Session
   * @param {ContextEventUserInfo | object} [params.userInfo] Pass-through info
   * @returns {JourneyContext} Chain
   */
  applyEventListeners({ event, session, userInfo }) {
    if (!this.#eventListeners.length) {
      return this;
    }

    const previousContext = JourneyContext.fromObject(
      this.#eventListenerPreState,
    );
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
        logMessage = "Calling generic event handler";
        runHandler = true;
      } else if (waypoint && !field) {
        logMessage = `Calling waypoint-specific event handler on "${waypoint}"`;
        runHandler =
          previousContext.data?.[waypoint] !== undefined &&
          !isEqual(this.data?.[waypoint], previousContext.data?.[waypoint]);
      } else if (waypoint && field) {
        logMessage = `Calling field-specific event handler on "${waypoint} : ${field}"`;
        runHandler =
          previousContext.data?.[waypoint]?.[field] !== undefined &&
          !isEqual(
            this.data?.[waypoint]?.[field],
            previousContext.data?.[waypoint]?.[field],
          );
      }

      if (runHandler) {
        log.trace(logMessage);
        handler({
          journeyContext: this,
          previousContext,
          session,
          userInfo,
        });
      }
    }
    /* eslint-enable security/detect-object-injection */

    return this;
  }

  /* ----------------------------------------------- session context handling */

  /**
   * Construct a new ephemeral JourneyContext instance with a unique ID.
   *
   * Note: In later versions of CASA, the `req` property will be mandatory.
   *
   * @param {ExpressRequest} [req] Request session
   * @returns {JourneyContext} Constructed JourneyContext instance
   */
  static createEphemeralContext(req) {
    return JourneyContext.fromObject({
      identity: {
        id: JourneyContext.generateContextId(req),
      },
    });
  }

  /**
   * Construct a new JourneyContext instance from another instance.
   *
   * Note: In later versions of CASA, the `req` property will be mandatory.
   *
   * @param {JourneyContext} context Context to copy from
   * @param {ExpressRequest} [req] Request
   * @returns {JourneyContext} Constructed JourneyContext instance
   * @throws {TypeError} When context is not a valid type
   */
  static fromContext(context, req) {
    if (!(context instanceof JourneyContext)) {
      throw new TypeError("Source context must be a JourneyContext");
    }

    const newContextObj = context.toObject();
    newContextObj.identity.id = JourneyContext.generateContextId(req);

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
      log.trace(
        "Session context list already initialised as an object (legacy structure). Will convert from object to array.",
      );

      session.journeyContextList = Object.entries(session.journeyContextList);
    }

    // Initialise new context list in the session
    if (!Object.hasOwn(session, "journeyContextList")) {
      log.trace("Initialising session with a default journey context list");

      session.journeyContextList = [];

      const defaultContext = new JourneyContext();
      defaultContext.identity.id = JourneyContext.DEFAULT_CONTEXT_ID;
      JourneyContext.putContext(session, defaultContext);
    }
  }

  /**
   * Validate the format of a context ID:
   *
   * - Between 1 and 64 characters
   * - Contain only the characters a-z, 0-9, -
   *
   * @param {string} id Context ID
   * @returns {string} Original ID if it's valid
   * @throws {TypeError} When id is not a valid type
   * @throws {SyntaxError} When id is not a valid format
   */
  static validateContextId(id) {
    if (id === JourneyContext.DEFAULT_CONTEXT_ID) {
      return JourneyContext.DEFAULT_CONTEXT_ID;
    }

    if (typeof id !== "string") {
      throw new TypeError("Context ID must be a string");
    } else if (!id.match(/^[a-z0-9-]{1,64}$/)) {
      throw new SyntaxError("Context ID is not in the correct format");
    }

    return id;
  }

  /**
   * Generate a new context ID, validate it, and throw if the ID has already
   * been generated during this request lifecycle. This may happen if an ID was
   * generated, but never used to store a new context in the session. Therefore
   * it is important for user code to always call `putContext()` before
   * generating another ID.
   *
   * @param {ExpressRequest} [req] Request
   * @returns {string} New ID
   * @throws {Error} When generated ID has already been used
   */
  static generateContextId(req) {
    // Can't generate custom ID when no request object is provided, because the
    // custom generator function itself exists on that object.
    if (!req) {
      throw new Error("Missing required request object.");
    }

    // Define a default context ID generator if required
    if (!Object.hasOwn(req, JourneyContext.ID_GENERATOR_REQ_KEY)) {
      log.warn(
        "A context ID generator is not present in the request. Reverting to uuid().",
      );
      Object.defineProperty(req, JourneyContext.ID_GENERATOR_REQ_KEY, {
        value: uuid,
        enumerable: false,
        writable: false,
      });
    }

    // Collate a list of context IDs already in use, either from existing
    // contexts in the session, or generated during this request lifecycle.
    // We don't identify the source of each ID because the generator must not
    // differentiate its behaviour on whether the ID exists in session or not.
    const inSessionIds = JourneyContext.getContexts(req.session)
      .map((c) => c.identity.id)
      .filter((id) => id !== JourneyContext.DEFAULT_CONTEXT_ID);
    const inRequestIds = req[JourneyContext.ID_GENERATOR_REQ_LOG] ?? [];
    const reservedIds = Array.from(
      new Set([...inSessionIds, ...inRequestIds]).values(),
    );

    // Generate and log the ID
    const id = JourneyContext.validateContextId(
      req[JourneyContext.ID_GENERATOR_REQ_KEY].call(null, { req, reservedIds }),
    );
    if (reservedIds.includes(id)) {
      throw new Error(
        `Regenerated a context ID, ${String(id)}. It has likely not yet been used to store a new context in session using JourneyContext.putContext().`,
      );
    }

    if (!req[JourneyContext.ID_GENERATOR_REQ_LOG]) {
      Object.defineProperty(req, JourneyContext.ID_GENERATOR_REQ_LOG, {
        value: [],
        enumerable: false,
        writable: false,
      });
    }
    req[JourneyContext.ID_GENERATOR_REQ_LOG].push(id);

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
    return JourneyContext.getContextById(
      session,
      JourneyContext.DEFAULT_CONTEXT_ID,
    );
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
      const context = [...list.values()].find((c) => c.identity.name === name);
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
   * @returns {JourneyContext[]} The discovered JourneyContext instance
   */
  static getContextsByTag(session, tag) {
    if (session) {
      const list = new Map(session?.journeyContextList);
      return [...list.values()]
        .filter((c) => c.identity.tags?.includes(tag))
        .map((c) => JourneyContext.fromObject(c));
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
    if (session && Object.hasOwn(session, "journeyContextList")) {
      return session.journeyContextList.map(([, contextObj]) =>
        JourneyContext.fromObject(contextObj),
      );
    }

    return [];
  }

  /**
   * Put context back into the session store.
   *
   * @param {object} session Request session
   * @param {JourneyContext} context Context
   * @param {object} options Options
   * @param {ContextEventUserInfo | object} [options.userInfo] Pass-through
   *   event info
   * @returns {void}
   * @throws {TypeError} When session is not a valid type, or context has no ID
   */
  static putContext(session, context, options = {}) {
    if (!isObject(session)) {
      throw new TypeError("Session must be an object");
    } else if (!(context instanceof JourneyContext)) {
      throw new TypeError("Context must be a valid JourneyContext");
    } else if (context.identity.id === undefined) {
      throw new TypeError("Context must have an ID before storing in session");
    }

    // Initialise the session if necessary
    if (Object.hasOwn(session, "journeyContextList") === false) {
      JourneyContext.initContextStore(session);
    }

    // Apply context events
    const { userInfo = undefined } = options;

    context.applyEventListeners({
      event: "waypoint-change",
      session,
      userInfo,
    });

    context.applyEventListeners({
      event: "context-change",
      session,
      userInfo,
    });

    const list = new Map(session.journeyContextList);
    list.set(context.identity.id, context.toObject());

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
    const index = (session?.journeyContextList ?? []).findIndex(
      ([contextId]) => contextId === id,
    );
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
    for (const c of JourneyContext.getContextsByTag(session, tag)) {
      JourneyContext.removeContext(session, c);
    }
  }

  /**
   * Remove call contexts.
   *
   * @param {object} session Request session
   * @returns {void}
   */
  static removeContexts(session) {
    for (const c of JourneyContext.getContexts(session)) {
      JourneyContext.removeContext(session, c);
    }
  }

  /**
   * Extract the Journey Context referred to in the incoming request.
   *
   * This will look in `req.params`, `req.query` and `req.body` for a
   * `contextid` parameter, and use that to load the correct Journey Context
   * from the session.
   *
   * @param {ExpressRequest} req ExpressJS incoming request
   * @returns {JourneyContext} The Journey Context
   */
  static extractContextFromRequest(req) {
    JourneyContext.initContextStore(req.session);

    let contextId;
    if (req.params && Object.hasOwn(req.params, "contextid")) {
      log.trace("Context ID found in req.params.contextid");
      contextId = String(req.params.contextid);
    } else if (req.query && Object.hasOwn(req.query, "contextid")) {
      log.trace("Context ID found in req.query.contextid");
      contextId = String(req.query.contextid);
    } else if (req.body && Object.hasOwn(req.body, "contextid")) {
      log.trace("Context ID found in req.body.contextid");
      contextId = String(req.body.contextid);
    } else {
      log.trace(
        "Context ID not specified or not found; will attempt to use default",
      );
      contextId = JourneyContext.DEFAULT_CONTEXT_ID;
    }

    try {
      contextId = JourneyContext.validateContextId(contextId);
      const context = JourneyContext.getContextById(req.session, contextId);
      if (!context) {
        throw new Error(`Could not find a context with id, ${contextId}`);
      }
      return context;
    } catch (err) {
      log.debug(err.message);
      log.trace("Falling back to default context");
      return JourneyContext.getContextById(
        req.session,
        JourneyContext.DEFAULT_CONTEXT_ID,
      );
    }
  }

  /**
   * Set page skipped status.
   *
   * @param {string} waypoint Waypoint to skip.
   * @param {boolean | object} opts Is skipped flag or options.
   * @param {string} opts.to Waypoint to skip to.
   */
  setSkipped(waypoint, opts) {
    /* eslint-disable security/detect-object-injection */
    // Unset, with setSkipped(a, false)
    if (opts === false) {
      this.data[waypoint] ??= Object.create(null);
      this.data[waypoint].__skipped__ = undefined;
      this.data[waypoint].__skip__ = undefined;
    }
    // Set, with setSkipped(a, true) and clear data
    else if (opts === true) {
      this.data[waypoint] = Object.create(null);
      this.data[waypoint].__skipped__ = true;
      this.data[waypoint].__skip__ = { to: null };
    }
    // Set, with setSkipped(a, { to: b }) and clear data
    else if (typeof opts?.to === "string") {
      this.data[waypoint] = Object.create(null);
      this.data[waypoint].__skipped__ = true;
      this.data[waypoint].__skip__ = { to: opts.to };
    } else {
      throw new TypeError(
        `setSkipped opts must be a boolean or object with a "to" prop of waypoint to skip to, got: ${typeof opts}`,
      );
    }
    /* eslint-enable security/detect-object-injection */
  }

  /**
   * Tests if a page has been skipped.
   *
   * @param {string} waypoint Page ID (waypoint).
   * @param {object} opts Skip ptions.
   * @param {string} opts.to Waypoint that should be skipped to.
   * @returns {boolean} True if the page has been skipped, or if it has been
   *   skipped to a specific page.
   */
  isSkipped(waypoint, opts) {
    const wpData = this.data[String(waypoint)];

    if (opts === undefined) {
      return wpData?.__skipped__ === true || wpData?.__skip__ !== undefined;
    } else if (typeof opts.to === "string") {
      return wpData?.__skip__?.to === opts.to;
    }
  }
}
