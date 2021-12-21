/**
 * At the time of writing, standard-version does not work with modules using
 * ESM. This script is a workaround for that.
 */
import standardVersion from 'standard-version';

standardVersion({
  skip: {
    tag: true
  },
  tagPrefix: '',
  bumpFiles: [{
    filename: 'package.json',
    type: 'json',
  }, {
    filename: 'package-lock.json',
    type: 'json',
  }, {
    filename: 'sonar-project.properties',
    updater: {
      readVersion: (contents) => (contents.match(/sonar.projectVersion=(.+)$/m) || [,])[1],
      writeVersion: (contents, version) => contents.replace(/sonar.projectVersion=(.+)$/m, `sonar.projectVersion=${version}`),
    },
  }]
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
