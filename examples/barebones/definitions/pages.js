const personalDetailsFields = require('./fields/personal-details.js');
const checkboxesFields = require('./fields/checkboxes.js');
const contactDetailsFields = require('./fields/contact-details.js');
const secretAgentFields = require('./fields/secret-agent.js');
const workImpactFields = require('./fields/work-impact.js');
const bethsPageFields = require('./fields/beths-page.js')

module.exports = () => [{
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
}, 
{
  waypoint: 'beths-page',
  view: 'pages/beths-page.njk',
  fields: bethsPageFields(),
},
{
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
