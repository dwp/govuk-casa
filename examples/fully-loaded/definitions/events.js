export default (plan) => [
  // If the user no longer has a partner, let's clear out some data from any
  // pages related to their partner
  {
    event: 'waypoint-change',
    waypoint: 'live-with-partner',
    field: 'havePartner',
    handler: ({ journeyContext, previousContext }) => {
      // Purge waypoints that will no longer be visited
      journeyContext.purge(['your-partners-name']);

      // Invalidate some waypoints that we need the user to re-visit, because
      // the context of the questions on these pages have changed
      journeyContext.invalidate(['accounts']);
    },
  },

  {
    event: 'context-change',
    handler: ({ journeyContext, previousContext }) => {
      // `context-change` event was triggered
    },
  }
];
