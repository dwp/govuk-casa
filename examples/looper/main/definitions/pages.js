import hasHobbiesFields from './fields/has-hobbies.js';
import hobbiesSummaryHooks from './hooks/hobbies-summary.js';
import submitHooks from './hooks/submit.js';

export default () => [{
  waypoint: 'has-hobbies',
  view: 'pages/has-hobbies.njk',
  fields: hasHobbiesFields(),
}, {
  waypoint: 'hobbies-summary',
  view: 'pages/hobbies-summary.njk',
  hooks: hobbiesSummaryHooks(),
}, {
  waypoint: 'submit',
  view: 'pages/submit.njk',
  hooks: submitHooks(),
}];
