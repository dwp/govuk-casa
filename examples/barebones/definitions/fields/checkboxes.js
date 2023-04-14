import { field, validators as r, ValidationError } from '@dwp/govuk-casa';

export default () => [
  field('boxes').validators([
    r.required.make(),

    // Custom validation, with sanitisation, using a basic object format
    {
      name: 'boxCount',

      validate: (value, { waypoint, fieldName, journeyContext }) => {
        // Must specify at least 3 options
        if (!Array.isArray(value) || value.length < 3) {
          const fieldValue = journeyContext.getDataForPage(waypoint)[fieldName];
          return [
            ValidationError.make({
              errorMsg: {
                inline: 'checkboxes:errors.min.inline',
                summary: 'checkboxes:errors.min.summary',
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
  ]),
];
