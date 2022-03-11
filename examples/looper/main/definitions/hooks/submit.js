import { JourneyContext } from '@dwp/govuk-casa';

export default () => [{
  hook: 'presanitise',
  middleware: (req, res, next) => {
    // Collect all context data from the loop
    const loopContexts = JourneyContext.getContextsByTag(req.session, 'looper-hobbies-summary').map((c) => c.data);
    console.log(JSON.stringify(loopContexts, null, 2));

    // Prepare all the gathered data and send it to an upstream service
    console.log(JSON.stringify(req.casa.journeyContext.getData(), null, 2));

    // Remember to clear the journey data once submitted
    req.session.destroy((err) => {
      if (err) {
        console.error(err);
      }
      res.status(302).redirect(`${req.baseUrl}/what-happens-next`);
    });
  },
}];
