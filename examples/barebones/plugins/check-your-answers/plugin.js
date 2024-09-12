import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { waypointUrl } from "@dwp/govuk-casa";

const __dirname = dirname(fileURLToPath(import.meta.url));

const reSlugger = /[^a-z0-9\-]+/gi;

const slug = (waypoint) => waypoint.replace(reSlugger, "-");

const stringify = (value) => {
  // TODO: Handle all data types. See issue #63
  return value;
};

/**
 * Waypoint[] = list of waypoints on which CYA will be enabled
 *
 * @param {CheckYourAnswersPluginOptions} param0
 * @returns
 */
export default ({ waypoints = ["check-your-answers"] }) => {
  const configure = (config) => {
    // Structure pages to make it more easily searchable by waypoint
    const pages = {};
    for (const page of config.pages) {
      pages[page.waypoint] = page;
    }

    // Add a views directory
    config.views.push(resolve(__dirname, "views"));

    // Set the view on each nominated waypoint page
    config.pages = [
      ...config.pages,
      ...waypoints.map((waypoint) => ({
        waypoint,
        view: "check-your-answers/template.njk",
        hooks: [
          {
            hook: `prerender`,
            middleware: (req, res, next) => {
              // Grab a list of all pages up to this point
              const traversed = config.plan.traverse(req.casa.journeyContext);

              const sections = [];
              for (const wp of traversed) {
                // TODO: Need to handle exit nodes (e.g. waypoints using `url://` protocol)
                sections.push({
                  waypoint: req.t(`${slug(wp)}:pageTitle`),
                  rows: (pages?.[wp]?.fields ?? [])
                    .filter((f) => f.meta.persist)
                    .map((field) => ({
                      key: {
                        text: req.t(`${slug(wp)}:field.${field.name}.label`),
                      },
                      value: {
                        text: stringify(
                          req.casa.journeyContext.data?.[wp]?.[field.name],
                        ),
                      },
                      actions: {
                        items: [
                          {
                            href:
                              waypointUrl({
                                journeyContext: req?.casa?.journeyContext,
                                waypoint: wp,
                                mountUrl: `${req.baseUrl}/`,
                                edit: true,
                                editOrigin: waypointUrl({
                                  journeyContext: req?.casa?.journeyContext,
                                  waypoint,
                                  mountUrl: `${req.baseUrl}/`,
                                }),
                              }) + `#f-${field.name}`,
                            text: req.t("check-your-answers:change"),
                            visuallyHiddenText: req.t(
                              `${slug(wp)}:field.${field.name}.label`,
                            ),
                            classes: "govuk-link--no-visited-state",
                          },
                        ],
                      },
                    })),
                });
              }

              res.locals.sections = sections.filter((s) => s.rows.length);

              next();
            },
          },
        ],
      })),
    ];
  };

  return {
    configure,
  };
};
