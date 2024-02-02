import { Plan } from "@dwp/govuk-casa";

export default () => {
  const plan = new Plan({
    // Demo of one technique to handle traversal arbitration; see docs for more
    // options as `auto` can be expensive
    arbiter: "auto",
  });

  plan.addSequence("personal-details", "checkboxes", "contact-details");

  plan.setRoute(
    "contact-details",
    "secret-agent",
    (r, c) => c.data["contact-details"].tel === "007",
  );
  plan.setRoute(
    "contact-details",
    "work/impact",
    (r, c) => c.data["contact-details"].tel !== "007",
  );

  plan.setRoute("secret-agent", "work/impact");

  plan.addSequence("work/impact", "review", "submit");

  return plan;
};
