import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default (options) => {
  const configure = (config) => {
    // Add a views directory
    config.views.push(resolve(__dirname, "views"));
  };

  const bootstrap = ({
    nunjucksEnv,
    ancillaryRouter,
    cookieParserMiddleware,
  }) => {
    // Add a new general info page
    ancillaryRouter.get("/cookie-consent/info", (req, res, next) => {
      res.render("cookie-consent/info.njk");
    });

    // Make the cookie choice available to all templates, on all pages, so that
    // the cookie-banner template can use it to show/hide itself.
    // This is _prepended_ to ensure it has the best chance of appearing before
    // any template rendering middleware.
    ancillaryRouter.prependUse(cookieParserMiddleware, (req, res, next) => {
      if (req.cookies.cookie_consent_complete) {
        res.locals.cookieConsentHideBanner = true;
      } else if (req.cookies.cookie_consent) {
        res.cookie("cookie_consent_complete", true);
      }
      res.locals.cookieConsentChoice = req.cookies.cookie_consent
        ? String(req.cookies.cookie_consent)
        : undefined;
      next();
    });

    // Handle response from cookie banner
    // We can't use `csrfMiddleware` here because we can't insert a csrf token
    // into the banner form. We don't know what pages this banner will be shown
    // on, and as such can't guarantee that the session middleware is present
    // on all routes.
    ancillaryRouter.post(
      "/cookie-consent/accept",
      cookieParserMiddleware,
      (req, res, next) => {
        res.cookie("cookie_consent", "accept");
        res.redirect(302, `${req.baseUrl}/`); // TODO: needs to go back to the page user came from
      },
    );
    ancillaryRouter.post(
      "/cookie-consent/reject",
      cookieParserMiddleware,
      (req, res, next) => {
        res.cookie("cookie_consent", "reject");
        res.redirect(302, `${req.baseUrl}/`);
      },
    );

    // Inject cookie banner template into the `bodyStart` block
    nunjucksEnv.modifyBlock("bodyStart", () => {
      return '{% include "cookie-consent/banner.njk" %}';
    });

    // If cookies are accepted, we can inject some extra javascript
    nunjucksEnv.modifyBlock("bodyEnd", () => {
      return '{% if cookieConsentChoice == "accept" %}{% include "cookie-consent/consented-scripts.njk" ignore missing %}{% endif %}';
    });
  };

  return {
    configure,
    bootstrap,
  };
};
