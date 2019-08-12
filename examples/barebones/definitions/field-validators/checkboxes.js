const { validationRules: r, simpleFieldValidation: sf} = require('@dwp/govuk-casa');

const fieldValidators = {
  boxes: sf([
    r.required,
    (value, context) => {
      // Must specify at least 3 options
      if (!Array.isArray(value) || value.length < 3) {
        return Promise.reject({
          inline: 'checkboxes:errors.min.inline',
          summary: 'checkboxes:errors.min.summary'
        })
      } else {
        return Promise.resolve();
      }
    }
  ])
};

module.exports = fieldValidators;
