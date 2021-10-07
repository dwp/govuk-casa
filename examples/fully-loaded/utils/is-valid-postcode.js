import { ValidationError } from '../../../src/casa.js';

const isPostcode = /^([A-Za-z][A-Ha-hK-Yk-y]?[0-9][A-Za-z0-9]? ?[0-9][A-Za-z]{2}|[Gg][Ii][Rr] ?0[Aa]{2})$/;

const isValidPostcode = (errorMsg) => ({
  name: 'isValidPostcode',

  validate: (fieldValue = '') => {
    const valueWithoutSpaces = fieldValue.replace(/\s+/g, '');

    if (isPostcode.test(valueWithoutSpaces)) {
      return [];
    }

    return [
      ValidationError.make({
        errorMsg,
      }),
    ];
  },

  sanitise: (fieldValue) => String(fieldValue ?? ''),
});

export default isValidPostcode;
