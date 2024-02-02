export default [
  {
    hook: "journey.presteer",
    middleware: (req, res, next) => {
      /* console.log('global hook journey.presteer called'); */ next();
    },
  },
  {
    hook: "journey.poststeer",
    middleware: (req, res, next) => {
      /* console.log('global hook journey.poststeer called'); */ next();
    },
  },
  {
    hook: "journey.presanitise",
    middleware: (req, res, next) => {
      /* console.log('global hook journey.presanitise called'); */ next();
    },
  },
  {
    hook: "journey.postsanitise",
    middleware: (req, res, next) => {
      /* console.log('global hook journey.postsanitise called'); */ next();
    },
  },
  {
    hook: "journey.pregather",
    middleware: (req, res, next) => {
      /* console.log('global hook journey.pregather called'); */ next();
    },
  },
  {
    hook: "journey.postgather",
    middleware: (req, res, next) => {
      /* console.log('global hook journey.postgather called'); */ next();
    },
  },
  {
    hook: "journey.prevalidate",
    middleware: (req, res, next) => {
      /* console.log('global hook journey.prevalidate called'); */ next();
    },
  },
  {
    hook: "journey.postvalidate",
    middleware: (req, res, next) => {
      /* console.log('global hook journey.postvalidate called'); */ next();
    },
  },
  {
    hook: "journey.preredirect",
    middleware: (req, res, next) => {
      /* console.log('global hook journey.preredirect called'); */ next();
    },
  },
  {
    hook: "journey.prerender",
    middleware: (req, res, next) => {
      // Some page content changes if Northern Ireland is chosen, or the user
      // has a partner. Set flags for those here.
      res.locals.northernIrelandPrefix =
        req.casa.journeyContext.data?.country?.country === "NORTHERN_IRELAND"
          ? "northernIreland."
          : "";
      res.locals.claimTypePrefix =
        req.casa.journeyContext.data?.["live-with-partner"]?.havePartner ===
        "yes"
          ? "joint."
          : "single.";
      next();
    },
  },
];
