const { field, validators: r } = require('@dwp/govuk-casa');

module.exports = () => [{
  waypoint: 'start',
  view: 'pages/start.njk',
  fields: [
    field('name').validators([
      r.required.make(),
    ]),
  ],
}, {
  waypoint: 'venue-date',
  view: 'pages/venue-date.njk',
  fields: [
    field('venueDate', { optional: true }).validators([
      r.dateObject.make(),
    ]),
  ],
}, {
  waypoint: 'require-dj',
  view: 'pages/require-dj.njk',
  fields: [
    field('dj').validators([
      r.inArray.make({ source: ['yes', 'no'] }),
    ]),
  ],
}, {
  waypoint: 'tiers',
  view: 'pages/tiers.njk',
  fields: [
    field('tiers', { optional: true }),
  ],
}];
