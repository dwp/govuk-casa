import { field, validators as r } from  '../../../../src/casa.js';

export default () => [
  field('fullName').validators([
    r.required.make({
      errorMsg: 'your-name:field.fullName.required',
    }),
    r.strlen.make({
      max: 100,
      errorMsgMax: 'your-name:field.fullName.length',
    }),
  ]),
];
