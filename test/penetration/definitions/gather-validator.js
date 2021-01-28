const { Duration } = require('luxon');

const Validation = require('../../../lib/Validation.js');

const r = Validation.rules;
const sf = Validation.SimpleField;

const fieldValidators = {
  field_input: sf([
    r.required,
    r.strlen.bind({
      min: 5,
    }),
  ]),
  field_boxes: sf([
    r.inArray.bind({
      source: ['option0', 'option1'],
    }),
  ]),
  field_date: sf([
    r.required.bind({
      errorMsg: {
        summary: 'Please provide a date',
        focusSuffix: ['[dd]'],
      },
    }),
    r.dateObject.bind({
      beforeOffsetFromNow: Duration.fromObject({ days: 7 }),
    }),
  ]),
  field_radios: sf([
    r.inArray.bind({
      source: ['option0', 'option1'],
    }),
  ]),
  field_textarea: sf([
    r.required,
    r.strlen.bind({
      max: 20,
    }),
  ]),
};

module.exports = fieldValidators;
