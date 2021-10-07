import { field, validators as r } from '../../../../src/casa.js';

export default () => [
  field('country').validators([
    r.required.make({
      errorMsg: 'country:field.country.required',
    }),
    r.inArray.make({
      source: ['ENGLAND', 'SCOTLAND', 'WALES', 'NORTHERN_IRELAND', 'somewhereElse'],
      errorMsg: 'country:field.country.required',
    }),
  ]),
];
