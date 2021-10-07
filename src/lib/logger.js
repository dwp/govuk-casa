import debug from 'debug';

const casaDebugger = debug('casa');

export default (ns) => {
  const logger = casaDebugger.extend(ns);

  return {
    trace: logger.extend('trace'),
    debug: logger.extend('debug'),
    info: logger.extend('info'),
    warn: logger.extend('warn'),
    error: logger.extend('error'),
    fatal: logger.extend('fatal'),
  };
}
