// 2 middleware: one as a fallback 404 handler, one to handle thrown errors
import logger from '../lib/logger.js';

const log = logger('middleware:post');

export default function postMiddleware({
  mountUrl,
}) {
  return [
    (req, res) => {
      res.render('casa/errors/404.njk');
    },
    /* eslint-disable-next-line no-unused-vars */
    (err, req, res, next) => {
      // In some cases, an error may have been thrown before the template assets
      // have had a chance to initialise. So we use a hardcoded template in
      // these cases to ensure the user sees an appropriate message.
      let TEMPLATE = 'casa/errors/500.njk';
      if (!res.locals.t) {
        res.locals.t = () => ('');
        res.locals.casa = {
          ...res.locals?.casa,
          mountUrl,
        };
        TEMPLATE = 'casa/errors/static.njk';
      }

      // CSRF token is invalid in some way
      if (err?.code === 'EBADCSRFTOKEN') {
        log.info('CSRF validation has failed. This may be caused by the user submitting a stale form from a previous session [EBADCSRFTOKEN]');
        return res.status(403).render(TEMPLATE, { errorCode: 'bad_csrf_token' });
      }

      // Body parsing verification check failed
      if (err?.type === 'entity.verify.failed') {
        log.info('Body parser verification has failed. This has been caused by the user submitting a payload containing invalid data [entity.verify.failed]');
        return res.status(403).render(TEMPLATE, { errorCode: 'invalid_payload' });
      }

      // Too many parameters submitted
      if (err?.type === 'parameters.too.many') {
        log.info('The request contains more parameters than is currently allowed [parameters.too.many]');
        return res.status(413).render(TEMPLATE, { errorCode: 'parameter_limit_exceeded' });
      }

      // Overall payload too large
      if (err?.type === 'entity.too.large') {
        log.info(`The request payload is too large. Received ${err.length}b with a maximum of ${err.limit}b [parameters.too.many]`);
        return res.status(413).render(TEMPLATE, { errorCode: 'payload_size_exceeded' });
      }

      // Unaccept request method
      if (err?.code === 'unaccepted_request_method') {
        log.info(err.message);
        return res.status(400).render(TEMPLATE, { errorCode: 'unaccepted_request_method' });
      }

      // Unknown error
      log.error(`Unknown error: ${err.message}; stacktrace: ${err.stack}`);
      return res.status(200).render(TEMPLATE);
    },
  ]
}
