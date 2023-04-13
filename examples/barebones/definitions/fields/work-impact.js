import { field, validators as r } from '@dwp/govuk-casa';

export default () => [
  field('moreDifficult').validators([
    r.required.make({
      errorMsg: 'work-impact:field.moreDifficult.empty'
    }),
    r.inArray.make({
      source: ['yes', 'no'],
      errorMsg: 'work-impact:field.moreDifficult.empty'
    })
  ]),

  field('harderHow').validators([
    r.required.make({
      errorMsg: 'work-impact:field.harderHow.empty'
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
      errorMsg: 'work-impact:field.getAroundProblems.empty'
    }),
    r.inArray.make({
      source: ['yes', 'no'],
      errorMsg: 'work-impact:field.getAroundProblems.empty'
    })
  ]).condition(({ waypoint, journeyContext }) => {
    const formData = journeyContext.getDataForPage(waypoint);
    return formData.moreDifficult === 'yes';
  }),

  field('problemSolutions').validators([
    r.required.make({
      errorMsg: 'work-impact:field.problemSolutions.empty'
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
      errorMsg: 'work-impact:field.knowWhatWouldHelp.empty'
    }),
    r.inArray.make({
      source: ['yes', 'no'],
      errorMsg: 'work-impact:field.knowWhatWouldHelp.empty'
    })
  ]).condition(({ waypoint, journeyContext }) => {
    const formData = journeyContext.getDataForPage(waypoint);
    return formData.moreDifficult === 'yes';
  }),

  field('whatWouldHelp').validators([
    r.required.make({
      errorMsg: 'work-impact:field.whatWouldHelp.empty'
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
