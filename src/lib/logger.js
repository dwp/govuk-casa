import debug from 'debug';

const casaDebugger = debug('casa');

export default (namespace) => {
  const logger = casaDebugger.extend(namespace);

  return {
    trace: logger.extend('trace'),
    debug: logger.extend('debug'),
    info: logger.extend('info'),
    warn: logger.extend('warn'),
    error: logger.extend('error'),
    fatal: logger.extend('fatal'),
  };
}
