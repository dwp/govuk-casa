const { validationRules: r, simpleFieldValidation: sf, ValidationError } = require('@dwp/govuk-casa');

const fieldValidators = {
  boxes: sf([
    r.required,

    // Custom validation, with sanitisation
    {
      validate: function boxCountValidate (value, { waypointId, fieldName, journeyContext }) {
        // Must specify at least 3 options
        if (!Array.isArray(value) || value.length < 3) {
          const fieldValue = journeyContext.getDataForPage(waypointId)[fieldName];
          return Promise.reject(new ValidationError({
            inline: 'checkboxes:errors.min.inline',
            summary: 'checkboxes:errors.min.summary',
            variables: {
              count: fieldValue ? fieldValue.length : 0,
            }
          }));
        }
        return Promise.resolve();
      },

      sanitise: function boxCountSanitise (value) {
        if (Array.isArray(value)) {
          return value.map(String);
        }
        return undefined;
      }
    },
  ])
};

module.exports = fieldValidators;
