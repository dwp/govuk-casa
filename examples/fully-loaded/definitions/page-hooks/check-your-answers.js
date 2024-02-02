import { waypointUrl, nunjucksFilters } from "../../../../src/casa.js";

const { formatDateObject } = nunjucksFilters;

const makeAddress = ({ addressLine1, addressLine2, town, county, postcode }) =>
  `${addressLine1},${addressLine2},${town},${county},${postcode}`.replace(
    /,+/g,
    ",  ",
  );

export default () => {
  const rowFactory =
    (t, mountUrl, journeyContext) =>
    (waypoint, fieldName, value, key = `${waypoint}:pageTitle`) => ({
      key: { text: t(key) },
      value: { text: value },
      actions: {
        items: [
          {
            text: "Change",
            visuallyHiddenText: "",
            href:
              waypointUrl({
                journeyContext,
                waypoint,
                mountUrl,
                edit: true,
                editOrigin: waypointUrl({
                  journeyContext,
                  mountUrl,
                  waypoint: "check-your-answers",
                }),
              }) + `#f-${fieldName}`,
          },
        ],
      },
    });

  return [
    {
      hook: "prerender",
      middleware: (req, res, next) => {
        const d = req.casa.journeyContext.data;
        const row = rowFactory(
          req.t,
          `${req.baseUrl}/`,
          req.casa.journeyContext,
        );

        res.locals.rows = [
          row(
            "country",
            "country",
            d.country.country
              ? req.t(`country:field.country.options.${d.country.country}`)
              : req.t("country:unspecified"),
          ),
          row(
            "date-of-birth",
            "dateOfBirth",
            formatDateObject(d["date-of-birth"].dateOfBirth),
          ),
          row(
            "live-with-partner",
            "havePartner",
            d["live-with-partner"].havePartner.replace(/\b\w/g, (s) =>
              s.toUpperCase(),
            ),
          ),
          row("your-name", "fullName", d["your-name"].fullName),
        ];

        if (d["live-with-partner"].havePartner === "yes") {
          res.locals.rows = [
            ...res.locals.rows,
            row(
              "your-partners-name",
              "fullName",
              d["your-partners-name"].fullName,
            ),
            row(
              "live-with-partner",
              "partnerDateOfBirth",
              formatDateObject(d["live-with-partner"].partnerDateOfBirth),
              "live-with-partner:field.partnerDateOfBirth.legend",
            ),
            row(
              "your-relationship-status",
              "relationshipStatus",
              req.t(
                `your-relationship-status:field.relationshipStatus.options.${d["your-relationship-status"].relationshipStatus}`,
              ),
            ),
          ];
        }

        res.locals.rows = [
          ...res.locals.rows,
          row("your-address", "address", makeAddress(d["your-address"])),
          row(
            "accounts",
            "accounts[]",
            (d["accounts"].accounts || []).join(", "),
            `accounts:${res.locals.claimTypePrefix}pageTitle`,
          ),
          row("your-assets", "assetsValue", `£${d["your-assets"].assetsValue}`),
        ];

        res.locals.usingDemoContext = !req.casa.journeyContext.isDefault();

        next();
      },
    },
  ];
};
