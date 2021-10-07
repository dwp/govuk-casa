import { field, validators as r } from  '../../../../src/casa.js';

export default () => [
  field('dateOfBirth').validators([
    r.required.make({
      errorMsg: {
        summary: 'date-of-birth:field.dateOfBirth.required',
        focusSuffix: ['[dd]', '[mm]', '[yyyy]'],
      },
    }),
    r.dateObject.make({
      allowSingleDigitDay: true,
      allowSingleDigitMonth: true,
      beforeOffsetFromNow: { days: 1 },
      errorMsg: {
        summary: 'date-of-birth:field.dateOfBirth.format',
        focusSuffix: ['[dd]', '[mm]', '[yyyy]'],
      },
      errorMsgBeforeOffset: {
        summary: 'date-of-birth:field.dateOfBirth.future',
        focusSuffix: ['[dd]', '[mm]', '[yyyy]'],
      },
    }),
  ]).processors([
    // Trim spaces from each attribute
    (value) => ({
      dd: value.dd.replace(/\s+/g, ''),
      mm: value.mm.replace(/\s+/g, ''),
      yyyy: value.yyyy.replace(/\s+/g, ''),
    }),
  ]),
];
