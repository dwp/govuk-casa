const { expect } = require('chai');
const Logger = require('../../../lib/Logger.js');

describe('Logger', () => {
  it('should exist', () => {
    const logger = Logger();
    expect(logger).to.be.an('object');
  });

  it('should provide an info() method', () => {
    const logger = Logger();
    return expect(logger.info).to.exist;
  });

  it('should provide a debug() method', () => {
    const logger = Logger();
    return expect(logger.debug).to.exist;
  });

  it('should provide a warn() method', () => {
    const logger = Logger();
    return expect(logger.warn).to.exist;
  });

  it('should provide an error() method', () => {
    const logger = Logger();
    return expect(logger.error).to.exist;
  });

  it('should provide a fatal() method', () => {
    const logger = Logger();
    return expect(logger.fatal).to.exist;
  });

  it('should include reference to a session ID in message, if specified', () => {
    const logger = Logger();
    logger.setSessionId('MY_SESS_ID');
    logger.info('console');
    // TODO: How to capture output from logger
  });
});
