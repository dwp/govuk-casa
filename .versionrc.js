module.exports = {
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
    }
  ]
};
