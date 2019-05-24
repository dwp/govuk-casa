/* eslint-disable global-require */

module.exports = {
  gather: {
    view: 'pages/gather.njk',
    fieldValidators: require('./gather-validator.js'),
  },
};
