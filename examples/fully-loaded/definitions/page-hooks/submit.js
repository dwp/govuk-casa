export default () => [
  {
    hook: "presanitise",
    middleware: (req, res, next) => {
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
  },
];
