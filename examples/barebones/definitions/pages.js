import personalDetailsFields from './fields/personal-details.js';
import checkboxesFields from './fields/checkboxes.js';
import contactDetailsFields from './fields/contact-details.js';
import secretAgentFields from './fields/secret-agent.js';
import workImpactFields from './fields/work-impact.js';

export default () => [{
  waypoint: 'personal-details',
  view: 'pages/personal-details.njk',
  fields: personalDetailsFields(),
  hooks: [{
    hook: 'prerender',
    middleware: (req, res, next) => {
      console.log('Demo of a page-level hook function');
      next();
    }
  }],
}, {
  waypoint: 'checkboxes',
  view: 'pages/checkboxes.njk',
  fields: checkboxesFields(),
}, {
  waypoint: 'contact-details',
  view: 'pages/contact-details.njk',
  fields: contactDetailsFields(),
}, {
  waypoint: 'secret-agent',
  view: 'pages/secret-agent.njk',
  fields: secretAgentFields(),
}, {
  waypoint: 'work/impact',
  view: 'pages/work-impact.njk',
  fields: workImpactFields(),
}, {
  waypoint: 'submit',
  view: 'pages/submit.njk',
  fields: [],
  hooks: [{
    hook: 'presanitise',
    middleware: (req, res, next) => {
      // Here you would manipulate the data before then posting to some
      // upstream service
      console.log(JSON.stringify(req.casa.journeyContext.getData(), null, 2));

      // Remember to clear the journey data once submitted
      req.session.destroy((err) => {
        if (err) {
          console.error(err);
        }
        res.status(302).redirect(`${req.baseUrl}/what-happens-next`);
      });
    },
  }],
}];
