export default () => [{
  hook: 'prerender',
  middleware: (req, res, next) => {
    res.locals.rows = res.locals.loopContexts.map((context) => ({
      key: {
        text: "Type of hobby",
      },
      value: {
        text: `${context.data?.hobby?.type}${!context.isComplete ? ' (incomplete)' : ''}`,
      },
      actions: {
        items: [{
          // The behaviour of the "change" link will differ depending on the
          // user case, so you may want to use CASA's `waypointUrl()` function
          // to generate a customised link. See https://design-system.dwp.gov.uk/patterns/add-another-thing#changing-and-removing-items-from-the-summary-list-page
          // for details.
          href: context.editUrl,
          text: "Change",
          visuallyHiddenText: "type",
        }, {
          href: context.removeUrl,
          text: "Remove",
          visuallyHiddenText: "type",
        }]
      },
    }));

    next();
  },
}];
