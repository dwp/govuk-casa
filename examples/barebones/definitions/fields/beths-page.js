const { field, validators: r, ValidationError } = require('@dwp/govuk-casa');

module.exports = () => [field('foodBoxes').validators([
    r.required.make(),

    // Custom validation, with sanitisation, using a basic object format
    {
      name: 'boxCount',

      validate: (value, { waypoint, fieldName, journeyContext }) => {
        // Must specify at least 3 options
        if (!Array.isArray(value) || value.length < 1) {
          const fieldValue = journeyContext.getDataForPage(waypoint)[fieldName];
          return [
            ValidationError.make({
              errorMsg: {
                inline: 'beths-page:errors.min.inline',
                summary: 'beths-page:errors.min.summary',
                variables: {
                  count: fieldValue ? fieldValue.length : 0,
                }
              },
            }),
          ];
        }
        return []
      },

      sanitise: (value) => {
        if (Array.isArray(value)) {
          return value.map(String);
        }
        return undefined;
      }
    },
  ]),];