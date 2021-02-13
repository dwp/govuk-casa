const { validationRules: r, simpleFieldValidation: sf } = require('@dwp/govuk-casa');

const fieldValidators = {
  moreDifficult: sf([
    r.required.make({
      errorMsg: 'work-impact:moreDifficult.empty'
    }),
    r.inArray.make({
      source: ['yes', 'no'],
      errorMsg: 'work-impact:moreDifficult.empty'
    })
  ]),

  harderHow: sf([
    r.required.make({
      errorMsg: 'work-impact:harderHow.empty'
    }),
    r.strlen.make({
      max: 10000,
      errorMsgMax: 'work-impact:maxLength'
    })
  ], ({ waypointId, journeyContext }) => {
    const formData = journeyContext.getDataForPage(waypointId);
    return formData.moreDifficult === 'yes';
  }),

  getAroundProblems: sf([
    r.required.make({
      errorMsg: 'work-impact:getAroundProblems.empty'
    }),
    r.inArray.make({
      source: ['yes', 'no'],
      errorMsg: 'work-impact:getAroundProblems.empty'
    })
  ], ({ waypointId, journeyContext }) => {
    const formData = journeyContext.getDataForPage(waypointId);
    return formData.moreDifficult === 'yes';
  }),

  problemSolutions: sf([
    r.required.make({
      errorMsg: 'work-impact:problemSolutions.empty'
    }),
    r.strlen.make({
      max: 10000,
      errorMsgMax: 'work-impact:maxLength'
    })
  ], ({ waypointId, journeyContext }) => {
    const formData = journeyContext.getDataForPage(waypointId);
    return formData.moreDifficult === 'yes' && formData.getAroundProblems === 'yes';
  }),

  knowWhatWouldHelp: sf([
    r.required.make({
      errorMsg: 'work-impact:knowWhatWouldHelp.empty'
    }),
    r.inArray.make({
      source: ['yes', 'no'],
      errorMsg: 'work-impact:knowWhatWouldHelp.empty'
    })
  ], ({ waypointId, journeyContext }) => {
    const formData = journeyContext.getDataForPage(waypointId);
    return formData.moreDifficult === 'yes';
  }),

  whatWouldHelp: sf([
    r.required.make({
      errorMsg: 'work-impact:whatWouldHelp.empty'
    }),
    r.strlen.make({
      max: 10000,
      errorMsgMax: 'work-impact:maxLength'
    })
  ], ({ waypointId, journeyContext }) => {
    const formData = journeyContext.getDataForPage(waypointId);
    return formData.moreDifficult === 'yes' && formData.knowWhatWouldHelp === 'yes';
  })
};

module.exports = fieldValidators;
