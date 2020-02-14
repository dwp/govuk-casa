/**
 * Declarative definitions of pages within a user journey.
 */

const reviewPageDefinition = require('@dwp/govuk-casa/definitions/review-page');

exports = module.exports = (function() {
  var pages = Object.create(null);

  pages['personal-details'] = {
    view: 'pages/personal-details.njk',
    reviewBlockView: 'review-blocks/personal-details.njk',
    fieldValidators: require('./field-validators/personal-details'),
    fieldGatherModifiers: {
      title: (v) => (`${v.fieldValue}-mod`.replace(/(-mod)+$/g, '-mod')),
    },
    fieldWriter: ({ formData, contextData }) => {
      contextData.person = formData;
      return contextData;
    },
    fieldReader: ({ contextData }) => {
      return contextData.person;
    }
  };

  pages['contact-details'] = {
    view: 'pages/contact-details.njk',
    reviewBlockView: 'review-blocks/contact-details.njk',
    fieldValidators: require('./field-validators/contact-details'),
  };

  pages['secret-agent'] = {
    view: 'pages/secret-agent.njk',
    reviewBlockView: 'review-blocks/secret-agent.njk',
    fieldValidators: require('./field-validators/secret-agent'),
  };

  pages['work-impact'] = {
    view: 'pages/work-impact.njk',
    reviewBlockView: 'review-blocks/work-impact.njk',
    fieldValidators: require('./field-validators/work-impact'),
  };

  pages['checkboxes'] = {
    view: 'pages/checkboxes.njk',
    reviewBlockView: 'review-blocks/checkboxes.njk',
    fieldValidators: require('./field-validators/checkboxes')
  };

  // Create a `review` page that uses CASA's built-in handlers
  pages['review'] = reviewPageDefinition(pages);

  return pages;
})();
