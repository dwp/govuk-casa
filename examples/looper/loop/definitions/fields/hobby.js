import { field, validators as r } from '@dwp/govuk-casa';

export default () => [
  field('type').validators([
    r.required.make({
      errorMsg: 'hobby:field.type.required',
    }),
    r.inArray.make({
      source: ['PHYSICAL', 'MENTAL', 'SKILL', 'MYSTERY'],
      errorMsg: 'hobby:field.type.required',
    }),
  ]),
];
