const logger = require('../../lib/Logger.js')('variables');
const mwVariables = require('./variables.js');

module.exports = (app, mountUrl, phase, serviceName) => {
  app.use(mwVariables({
    logger,
    serviceName,
    govukFrontendVirtualUrl: app.get('casaGovukFrontendVirtualUrl'),
    mountUrl,
    phase,
  }));
};
