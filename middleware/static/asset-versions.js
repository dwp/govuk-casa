const fs = require('fs');

module.exports = (logger, packagesMeta = {}) => {
  const casaPackageVersions = {};

  Object.keys(packagesMeta).forEach((k) => {
    let version;
    try {
      // read() rather than require() to avoid accidental execution of source
      ({ version } = JSON.parse(fs.readFileSync(packagesMeta[k], 'utf8')));
    } catch (ex) {
      logger.debug('Cannot parse file %s (%s) to find version', k, packagesMeta[k]);
      logger.error(ex);
      version = '';
    }
    casaPackageVersions[k] = version;
  });

  return (req, res, next) => {
    res.locals.casa.packageVersions = casaPackageVersions;
    next();
  };
}
