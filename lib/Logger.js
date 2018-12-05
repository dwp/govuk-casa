/**
 * CASA logging wrapper. Provide a series of convenient logging functions, ready
 * pre-fixed with the CASA namespace.
 */

global.GOVUK_CASA_DEBUG_NS = 'casa';

const colors = require('colors/safe');
const ndebug = require('debug');

module.exports = function Logger(suffix) {
  const ns = GOVUK_CASA_DEBUG_NS + (suffix ? `:${suffix}` : '');

  let sessionId = '';

  const error = ndebug(`${ns}:error`);
  const fatal = ndebug(`${ns}:fatal`);

  const info = ndebug(`${ns}:info`);
  const warn = ndebug(`${ns}:warn`);
  const debug = ndebug(`${ns}:debug`);
  info.log = console.info.bind(console); /* eslint-disable-line no-console */
  warn.log = console.warn.bind(console); /* eslint-disable-line no-console */
  debug.log = console.log.bind(console); /* eslint-disable-line no-console */

  /**
   * Set the session ID for all messages in this debugger.
   *
   * @param {string} sid Session ID]
   * @returns {void}
   */
  function setSessionId(sid) {
    sessionId = sid;
  }

  /**
   * Wrapper for appending the session ID to all messages.
   *
   * @param  {...string} args Message(s)
   * @return {void}
   */
  function writer(...args) {
    const logArgs = args;
    logArgs[0] += sessionId ? colors.blue(` [session: ${sessionId}]`) : '';
    this(...logArgs);
  }

  return {
    info: writer.bind(info),
    debug: writer.bind(debug),
    warn: writer.bind(warn),
    error: writer.bind(error),
    fatal: writer.bind(fatal),
    setSessionId,
  };
};
