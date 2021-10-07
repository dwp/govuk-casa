// Some examples of how events can be used to manipulate the JourneyContext

module.exports = (plan) => [
  // This "waypoint-change" event is triggered whenever data/validation
  // changes on a waypoint, just prior to it being commited to the session.
  // In this example, we're using it to force the user to re-read their
  // contact-details if entering a certain secret code. It does this by
  // invalidating the 'contact-details' waypoint, forcing the user to re-visit.
  {
    event: 'waypoint-change',
    waypoint: 'secret-agent',
    field: 'license',
    handler: ({ journeyContext }) => {
      if (journeyContext.data['secret-agent']?.license === 'to kill') {
        console.log('removing validation state on contact-details because secret-agent has a "to kill" license');
        journeyContext.removeValidationStateForPage('contact-details');
      }
    },
  },

  // This "context-change" event is triggered after all "waypoint-change"
  // events have been applied, and just prior to the context being committed to
  // the session.
  // In this example, we're using it to re-traverse our Plan and purge any state
  // from JourneyContext for those waypoints that are no longer visitable.
  //
  // BE CAREFUL WITH THIS: You might want to keep some waypoint data because
  // they're not traversable _yet_, but you know they may be. Tricky way to do
  // thids cleanly en-mass. Better to use the `waypoint-change` events and
  // pinpoint the waypoints you want to purge.
  {
    event: 'context-change',
    handler: ({ journeyContext }) => {
      const traversed = plan.traverse(journeyContext);
      const all = plan.getWaypoints();
      const toPurge = all.filter(e => !traversed.includes(e));
      journeyContext.purge(toPurge);
      console.log(`Purged data for untraversable waypoints. We now have data for ${JSON.stringify(Object.keys(journeyContext.data))}`);
    },
  }
];
