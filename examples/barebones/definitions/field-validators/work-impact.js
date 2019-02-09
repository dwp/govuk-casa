const Validation = require('@dwp/govuk-casa/lib/Validation');
const r = Validation.rules;
const sf = Validation.SimpleField;

const fieldValidators = {
  moreDifficult: sf([
    r.required.bind({
      errorMsg: 'work-impact:moreDifficult.empty'
    }),
    r.inArray.bind({
      source: ['yes', 'no'],
      errorMsg: 'work-impact:moreDifficult.empty'
    })
  ]),

  harderHow: sf([
    r.required.bind({
      errorMsg: 'work-impact:harderHow.empty'
    }),
    r.strlen.bind({
      max: 10000,
      errorMsgMax: 'work-impact:maxLength'
    })
  ], (formData) => {
    return formData.moreDifficult === 'yes';
  }),

  getAroundProblems: sf([
    r.required.bind({
      errorMsg: 'work-impact:getAroundProblems.empty'
    }),
    r.inArray.bind({
      source: ['yes', 'no'],
      errorMsg: 'work-impact:getAroundProblems.empty'
    })
  ], (formData) => {
    return formData.moreDifficult === 'yes';
  }),

  problemSolutions: sf([
    r.required.bind({
      errorMsg: 'work-impact:problemSolutions.empty'
    }),
    r.strlen.bind({
      max: 10000,
      errorMsgMax: 'work-impact:maxLength'
    })
  ], (formData) => {
    return formData.moreDifficult === 'yes' && formData.getAroundProblems === 'yes';
  }),

  knowWhatWouldHelp: sf([
    r.required.bind({
      errorMsg: 'work-impact:knowWhatWouldHelp.empty'
    }),
    r.inArray.bind({
      source: ['yes', 'no'],
      errorMsg: 'work-impact:knowWhatWouldHelp.empty'
    })
  ], (formData) => {
    return formData.moreDifficult === 'yes';
  }),

  whatWouldHelp: sf([
    r.required.bind({
      errorMsg: 'work-impact:whatWouldHelp.empty'
    }),
    r.strlen.bind({
      max: 10000,
      errorMsgMax: 'work-impact:maxLength'
    })
  ], (formData) => {
    return formData.moreDifficult === 'yes' && formData.knowWhatWouldHelp === 'yes';
  })
};

module.exports = fieldValidators;
