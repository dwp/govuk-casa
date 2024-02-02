import accountsFields from "./fields/accounts.js";
import yourAssetsFields from "./fields/your-assets.js";
import countryFields from "./fields/country.js";
import dateOfBirthFields from "./fields/date-of-birth.js";
import liveWithPartnerFields from "./fields/live-with-partner.js";
import yourAddressFields from "./fields/your-address.js";
import yourNameFields from "./fields/your-name.js";
import yourPartnersNameFields from "./fields/your-partners-name.js";
import yourRelationshipStatusFields from "./fields/your-relationship-status.js";

import checkYourAnswersHooks from "./page-hooks/check-your-answers.js";
import submitHooks from "./page-hooks/submit.js";

export default () => [
  {
    waypoint: "country",
    view: "pages/country.njk",
    fields: countryFields(),
  },
  {
    waypoint: "do-not-live-in-uk",
    view: "pages/do-not-live-in-uk.njk",
  },
  {
    waypoint: "how-we-use-your-info",
    view: "pages/how-we-use-your-info.njk",
  },
  {
    waypoint: "date-of-birth",
    view: "pages/date-of-birth.njk",
    fields: dateOfBirthFields(),
  },
  {
    waypoint: "live-with-partner",
    view: "pages/live-with-partner.njk",
    fields: liveWithPartnerFields(),
  },
  {
    waypoint: "your-name",
    view: "pages/your-name.njk",
    fields: yourNameFields(),
  },
  {
    waypoint: "your-partners-name",
    view: "pages/your-partners-name.njk",
    fields: yourPartnersNameFields(),
  },
  {
    waypoint: "your-relationship-status",
    view: "pages/your-relationship-status.njk",
    fields: yourRelationshipStatusFields(),
  },
  {
    waypoint: "your-address",
    view: "pages/your-address.njk",
    fields: yourAddressFields(),
  },
  {
    waypoint: "accounts",
    view: "pages/accounts.njk",
    fields: accountsFields(),
  },
  {
    waypoint: "your-assets",
    view: "pages/your-assets.njk",
    fields: yourAssetsFields(),
  },
  {
    waypoint: "check-your-answers",
    view: "pages/check-your-answers.njk",
    hooks: checkYourAnswersHooks(),
  },
  {
    waypoint: "submit",
    view: "pages/submit.njk",
    hooks: submitHooks(),
  },
];
