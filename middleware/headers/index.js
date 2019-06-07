const logger = require('../../lib/Logger.js')('headers');

const mwHeaders = require('./headers.js');
const config = require('./config-defaults.js');

module.exports = (app, cspConfig = {}, disabledHeadersConfig = []) => {
  const { defaultHeaders } = config(app, cspConfig);
  app.use(mwHeaders(logger, defaultHeaders, disabledHeadersConfig));
};
