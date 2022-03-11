import { field, validators as r } from '@dwp/govuk-casa';

export default () => [
  field('zone').validators([
    r.required.make({
      errorMsg: 'location:field.zone.required',
    }),
    r.inArray.make({
      source: ['AZTEC', 'INDUSTRIAL', 'FUTURISTIC', 'MEDIEVAL'],
      errorMsg: 'location:field.zone.required',
    }),
  ]),
];
