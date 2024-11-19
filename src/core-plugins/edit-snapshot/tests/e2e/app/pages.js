import { field } from "../../../../../casa.js";

export default (plan) => [
  {
    waypoint: "start",
    view: "empty.njk",
  },
  {
    waypoint: "branch",
    view: "branch.njk",
    fields: [
      field("choice"),
    ],
    hooks: [{
      hook: "postvalidate",
      middleware: (req, res, next) => {
        if (!req.casa.journeyContext.isPageValid(req.casa.waypoint)) {
          return next();
        }

        const traversed = plan.traverse(req.casa.journeyContext);
        const all = plan.getWaypoints();
        const toPurge = all.filter((e) => !traversed.includes(e));
        req.casa.journeyContext.purge(toPurge);
        req.session.save(next);
      },
    }]
  },
  {
    waypoint: "route-a-first",
    view: "empty.njk",
  },
  {
    waypoint: "route-a-second",
    view: "empty.njk",
  },
  {
    waypoint: "route-b-first",
    view: "empty.njk",
  },
  {
    waypoint: "route-b-second",
    view: "empty.njk",
  },
  {
    waypoint: "cya",
    view: "cya.njk",
    hooks: [{
      hook: "prerender",
      middleware: (req, res, next) => {
        res.locals.traversedWaypoints = req.casa.plan.traverse(req.casa.journeyContext);
        next();
      },
    }]
  },
];
