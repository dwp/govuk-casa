const sinon = require('sinon');

const environment = () => {
  const env = {};
  env.express = sinon.stub().returns(env);
  return env;
};

module.exports = {
  environment,
};
