/* eslint-disable sonarjs/no-duplicate-string,class-methods-use-this */
import { Router } from 'express';

export default class MutableRouter {
  /**
   * @type {Array}
   */
  #stack;

  /**
   * @type {Router}
   */
  #router;

  /**
   * @type {boolean}
   */
  #sealed;

  /**
   * Mutable router.
   *
   * @class
   */
  constructor() {
    this.#router = new Router();
    this.#stack = [];
    this.#sealed = false;
  }

  #append(method, path, ...callbacks) {
    if (this.#sealed) {
      throw new Error('Cannot alter middleware in a sealed mutable router');
    }

    this.#stack.push({
      method,
      path,
      args: [path, ...callbacks],
    });
  }

  #prepend(method, path, ...callbacks) {
    if (this.#sealed) {
      throw new Error('Cannot alter middleware in a sealed mutable router');
    }

    this.#stack.splice(0, 0, {
      method,
      path,
      args: [path, ...callbacks],
    });
  }

  // This will replace the first found route, and remove all other routes on the
  // given path
  #replace(method, path, ...callbacks) {
    if (this.#sealed) {
      throw new Error('Cannot alter middleware in a sealed mutable router');
    }

    const finder = (command) => `${command.method}|${command.path}` === `${method}|${path}`;
    const index = this.#stack.findIndex(finder);

    if (index > -1) {
      this.#stack.splice(index, 1, {
        method,
        path,
        args: [path, ...callbacks],
      });

      this.#stack = this.#stack.filter((command, idx) => idx <= index || !finder(command))
    }
  }

  /**
   * Seals this router to make it immutable. Returns the ExpressJS router.
   *
   * @returns {Router} ExpressJS Router
   */
  seal() {
    if (this.#sealed) {
      return this.#router;
    }

    this.#stack.forEach(({ method, args }) => {
      // ESLint disabled as `#router` is dev-controlled, and `seal()` is only
      // run at boot-time before any user interaction
      /* eslint-disable-next-line security/detect-object-injection */
      this.#router[method].call(this.#router, ...args);
    });

    this.#sealed = true;

    return this.#router;
  }

  /* ------------------------------------------------------------- prependers */

  /**
   * Prepend middleware function(s) using the `all()` method.
   *
   * @param {string} path route path
   * @param  {...Function} callbacks Middleware functions
   * @returns {void}
   */
  prependAll(path, ...callbacks) {
    this.#prepend('all', path, ...callbacks);
  }

  /**
   * Prepend middleware function(s) using the `get()` method.
   *
   * @param {string} path route path
   * @param  {...Function} callbacks Middleware functions
   * @returns {void}
   */
  prependGet(path, ...callbacks) {
    this.#prepend('get', path, ...callbacks);
  }

  /**
   * Prepend middleware function(s) using the `post()` method.
   *
   * @param {string} path route path
   * @param  {...Function} callbacks Middleware functions
   * @returns {void}
   */
  prependPost(path, ...callbacks) {
    this.#prepend('post', path, ...callbacks);
  }

  /**
   * Prepend middleware function(s) using the `delete()` method.
   *
   * @param {string} path route path
   * @param  {...Function} callbacks Middleware functions
   * @returns {void}
   */
  prependDelete(path, ...callbacks) {
    this.#prepend('delete', path, ...callbacks);
  }

  /**
   * Prepend middleware function(s) using the `put()` method.
   *
   * @param {string} path route path
   * @param  {...Function} callbacks Middleware functions
   * @returns {void}
   */
  prependPut(path, ...callbacks) {
    this.#prepend('put', path, ...callbacks);
  }

  /**
   * Prepend middleware function(s) using the `use()` method.
   *
   * @param {string} path route path
   * @param  {...Function} callbacks Middleware functions
   * @returns {void}
   */
  prependUse(path, ...callbacks) {
    this.#prepend('use', path, ...callbacks);
  }

  /* -------------------------------------------------------------- replacers */
  // TODO: How do we handle multiple routes on the same path?

  /**
   * Replace middleware function(s) that were mounted using the `all()` method.
   *
   * @param {string} path route path
   * @param  {...Function} callbacks Middleware functions
   * @returns {void}
   */
  replaceAll(path, ...callbacks) {
    this.#replace('all', path, ...callbacks);
  }

  /**
   * Replace middleware function(s) that were mounted using the `get()` method.
   *
   * @param {string} path route path
   * @param  {...Function} callbacks Middleware functions
   * @returns {void}
   */
  replaceGet(path, ...callbacks) {
    this.#replace('get', path, ...callbacks);
  }

  /**
   * Replace middleware function(s) that were mounted using the `post()` method.
   *
   * @param {string} path route path
   * @param  {...Function} callbacks Middleware functions
   * @returns {void}
   */
  replacePost(path, ...callbacks) {
    this.#replace('post', path, ...callbacks);
  }

  /**
   * Replace middleware function(s) that were mounted using the `delete()` method.
   *
   * @param {string} path route path
   * @param  {...Function} callbacks Middleware functions
   * @returns {void}
   */
  replaceDelete(path, ...callbacks) {
    this.#replace('delete', path, ...callbacks);
  }

  /**
   * Replace middleware function(s) that were mounted using the `put()` method.
   *
   * @param {string} path route path
   * @param  {...Function} callbacks Middleware functions
   * @returns {void}
   */
  replacePut(path, ...callbacks) {
    this.#replace('put', path, ...callbacks);
  }

  /**
   * Replace middleware function(s) that were mounted using the `use()` method.
   *
   * @param {string} path route path
   * @param  {...Function} callbacks Middleware functions
   * @returns {void}
   */
  replaceUse(path, ...callbacks) {
    this.#replace('use', path, ...callbacks);
  }

  /* ---------------------------------------------- express.Router() wrappers */

  /**
   * Append middleware function(s) using the `all()` method.
   *
   * @param {string} path route path
   * @param  {...Function} callbacks Middleware functions
   * @returns {void}
   */
  all(path, ...callbacks) {
    this.#append('all', path, ...callbacks);
  }

  /**
   * Append middleware function(s) using the `get()` method.
   *
   * @param {string} path route path
   * @param  {...Function} callbacks Middleware functions
   * @returns {void}
   */
  get(path, ...callbacks) {
    this.#append('get', path, ...callbacks);
  }

  /**
   * Append middleware function(s) using the `post()` method.
   *
   * @param {string} path route path
   * @param  {...Function} callbacks Middleware functions
   * @returns {void}
   */
  post(path, ...callbacks) {
    this.#append('post', path, ...callbacks);
  }

  /**
   * Append middleware function(s) using the `delete()` method.
   *
   * @param {string} path route path
   * @param  {...Function} callbacks Middleware functions
   * @returns {void}
   */
  delete(path, ...callbacks) {
    this.#append('delete', path, ...callbacks);
  }

  /**
   * Append middleware function(s) using the `put()` method.
   *
   * @param {string} path route path
   * @param  {...Function} callbacks Middleware functions
   * @returns {void}
   */
  put(path, ...callbacks) {
    this.#append('put', path, ...callbacks);
  }

  /**
   * Append middleware function(s) using the `use()` method.
   *
   * @param {string} path route path
   * @param  {...Function} callbacks Middleware functions
   * @returns {void}
   */
  use(path, ...callbacks) {
    this.#append('use', path, ...callbacks);
  }

  route() {
    throw new Error('route() method is not supported on MutableRouter. Use verb methods for now.');
  }
}
