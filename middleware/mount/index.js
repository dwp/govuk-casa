const logger = require('../../lib/Logger.js')('journey');
const mwMount = require('./mount.js');

module.exports = (app, mountUrl = '/') => {
  if (mountUrl !== '/') {
    logger.info('Attaching mount redirection for %s', mountUrl);
    app.all('/', mwMount(logger, mountUrl));
  }
}
