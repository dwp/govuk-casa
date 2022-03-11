import hobbyFields from './fields/hobby.js';
import locationFields from './fields/location.js';

export default () => [{
  waypoint: 'hobby',
  view: 'pages/hobby.njk',
  fields: hobbyFields(),
}, {
  waypoint: 'location',
  view: 'pages/location.njk',
  fields: locationFields(),
}, {
  waypoint: 'check-your-hobby-answers',
  view: 'pages/check-your-hobby-answers.njk',
}];
