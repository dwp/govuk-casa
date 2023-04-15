import mealsFields from './meals.js';

export default () => [{
  waypoint: 'meals',
  view: 'pages/meals.njk',
  fields: mealsFields(),
}, {
  waypoint: 'complete',
  view: 'pages/complete.njk',
}];
