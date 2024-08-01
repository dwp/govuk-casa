import personalDetailsFields from "./fields/personal-details.js";

export default () => [
  {
    waypoint: "personal-details",
    view: "pages/personal-details.njk",
    fields: personalDetailsFields(),
  },
  {
    waypoint: "check-your-answers",
    view: "pages/check-your-answers.njk",
    fields: [],
    hooks: [
      {
        hook: `prerender`,
        middleware: (req, res, next) => {
          res.locals.personalData =  req.casa.journeyContext.data['personal-details'];
          next();
        },
      },
    ],
  },
];
