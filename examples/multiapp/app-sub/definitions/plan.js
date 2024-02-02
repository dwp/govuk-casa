import { Plan } from "@dwp/govuk-casa";

export default ({ mainAppMountUrl }) => {
  const plan = new Plan();

  plan.addSequence("genres", "moves-limit", `url://${mainAppMountUrl}`);

  return plan;
};
