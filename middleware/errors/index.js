const logger = require('../../lib/Logger.js')('errors');

const mw404 = require('./404.js');
const mwCatchAll = require('./catch-all.js');

module.exports = (app) => {
  app.use(mw404(logger));
  app.use(mwCatchAll(logger));
};
