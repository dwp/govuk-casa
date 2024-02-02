import { Plan } from "../../../../src/casa.js";

export default ({ fullyLoadedMountUrl }) => {
  const plan = new Plan({ arbiter: "auto" });

  plan.addSequence("meals", "complete", `url://${fullyLoadedMountUrl}`);

  return plan;
};
