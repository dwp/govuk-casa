import { field, validators as r } from '@dwp/govuk-casa';

export default () => [{
  waypoint: 'genres',
  view: 'pages/genres.njk',
  fields: [
    field('genres', { optional: true }).validators([
      r.inArray.make({ source: ['disco', 'blues', 'rock', 'hiphop', 'bagpipes'] }),
    ]),
  ],
}, {
  waypoint: 'moves-limit',
  view: 'pages/moves-limit.njk',
  fields: [
    field('limit', { optional: true }),
  ],
}];
