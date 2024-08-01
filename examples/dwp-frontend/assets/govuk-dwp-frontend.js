/*
@dwp/dwp-frontend: custom js build
*/
import dwp from "@dwp/dwp-frontend/components/components";

import * as govuk from "govuk-frontend/dist/govuk/all.mjs";


dwp.initAll();

govuk.initAll();

console.log("custom assets compiled");