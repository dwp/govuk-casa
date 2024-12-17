import { Plan } from "../../../../../casa.js";

export default () => {
  const plan = new Plan();

  plan.setRoute("start", "branch");

  plan.setRoute(
    "branch",
    "route-a-first",
    (r, c) => c.data?.branch?.choice === "route-a",
  );

  plan.setRoute(
    "branch",
    "route-b-first",
    (r, c) => c.data?.branch?.choice === "route-b",
  );

  plan.addSequence("route-a-first", "route-a-second", "cya");

  plan.addSequence("route-b-first", "route-b-second", "cya");

  return plan;
};
