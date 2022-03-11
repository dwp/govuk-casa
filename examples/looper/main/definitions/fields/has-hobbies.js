import { field, validators as r } from '@dwp/govuk-casa';

export default () => [
  field('hasHobbies').validators([
    r.required.make({
      errorMsg: 'has-hobbies:field.hasHobbies.required',
    }),
    r.inArray.make({
      source: ['yes', 'no'],
      errorMsg: 'has-hobbies:field.has-hobbies.required',
    }),
  ]),
];
