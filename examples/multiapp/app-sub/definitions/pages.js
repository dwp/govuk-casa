const { field, validators: r } = require('@dwp/govuk-casa');

module.exports = () => [{
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
