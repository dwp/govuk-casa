const { field, validators: r } = require('@dwp/govuk-casa');

module.exports = () => [
  field('moreDifficult').validators([
    r.required.make({
      errorMsg: 'work-impact:moreDifficult.empty'
    }),
    r.inArray.make({
      source: ['yes', 'no'],
      errorMsg: 'work-impact:moreDifficult.empty'
    })
  ]),

  field('harderHow').validators([
    r.required.make({
      errorMsg: 'work-impact:harderHow.empty'
    }),
    r.strlen.make({
      max: 10000,
      errorMsgMax: 'work-impact:maxLength'
    })
  ]).condition(({ waypoint, journeyContext }) => {
    const formData = journeyContext.getDataForPage(waypoint);
    return formData.moreDifficult === 'yes';
  }),

  field('getAroundProblems').validators([
    r.required.make({
      errorMsg: 'work-impact:getAroundProblems.empty'
    }),
    r.inArray.make({
      source: ['yes', 'no'],
      errorMsg: 'work-impact:getAroundProblems.empty'
    })
  ]).condition(({ waypoint, journeyContext }) => {
    const formData = journeyContext.getDataForPage(waypoint);
    return formData.moreDifficult === 'yes';
  }),

  field('problemSolutions').validators([
    r.required.make({
      errorMsg: 'work-impact:problemSolutions.empty'
    }),
    r.strlen.make({
      max: 10000,
      errorMsgMax: 'work-impact:maxLength'
    })
  ]).condition(({ waypoint, journeyContext }) => {
    const formData = journeyContext.getDataForPage(waypoint);
    return formData.moreDifficult === 'yes' && formData.getAroundProblems === 'yes';
  }),

  field('knowWhatWouldHelp').validators([
    r.required.make({
      errorMsg: 'work-impact:knowWhatWouldHelp.empty'
    }),
    r.inArray.make({
      source: ['yes', 'no'],
      errorMsg: 'work-impact:knowWhatWouldHelp.empty'
    })
  ]).condition(({ waypoint, journeyContext }) => {
    const formData = journeyContext.getDataForPage(waypoint);
    return formData.moreDifficult === 'yes';
  }),

  field('whatWouldHelp').validators([
    r.required.make({
      errorMsg: 'work-impact:whatWouldHelp.empty'
    }),
    r.strlen.make({
      max: 10000,
      errorMsgMax: 'work-impact:maxLength'
    })
  ]).condition(({ waypoint, journeyContext }) => {
    const formData = journeyContext.getDataForPage(waypoint);
    return formData.moreDifficult === 'yes' && formData.knowWhatWouldHelp === 'yes';
  }),
];
