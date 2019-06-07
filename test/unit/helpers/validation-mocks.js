const sinon = require('sinon');

const SimpleField = () => ({});

const ObjectField = () => ({});

const ArrayObjectField = () => ({});

const processor = () => (sinon.stub().resolves());

const rules = () => ({});

module.exports = {
  SimpleField,
  ObjectField,
  ArrayObjectField,
  processor,
  rules,
};
