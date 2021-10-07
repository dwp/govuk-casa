import csurf from 'csurf';

// 2 middleware: one to generate the csrf token and check its validity (POST
// only), and one to provide that token to templates via the `casa.csrfToken`
// variable.

export default function csrfMiddleware() {
  return [
    csurf({
      cookie: false,
      sessionKey: 'session',
      // value: (req) => {
      //   // Here we clear the token after extracting to maintain cleaner data. It
      //   // is only used for this CSRF purpose.
      //   const token = String(req.body._csrf);
      //   delete req.body._csrf;
      //   return token;
      //   /* eslint-enable no-underscore-dangle */
      // },
    }),
    (req, res, next) => {
      res.locals.casa = {
        ...res.locals?.casa,
        csrfToken: req.csrfToken(),
      };
      next();
    },
  ];
}
