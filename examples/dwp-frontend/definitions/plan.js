import { Plan } from "@dwp/govuk-casa";

export default () => {
  const plan = new Plan();

  plan.addSequence("personal-details", "check-your-answers");

  return plan;
};
