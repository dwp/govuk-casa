const { expect } = require('chai');
const sinon = require('sinon');
const { queueSimpleValidator } = require('../../../../../lib/validation/processor/queue.js');
const ValidationError = require('../../../../../lib/validation/ValidationError.js');
const rules = require('../../../../../lib/validation/rules/index.js');
const SimpleField = require('../../../../../lib/validation/SimpleField.js');
const { data } = require('../../../helpers/journey-mocks.js');

describe('Validation processor: queueSimpleValidator()', () => {
  const stubPageMeta = {
    id: 'stub-page-meta',
    view: 'stub-view',
  };

  it('should not queue any Promises if field is marked as optional, and value is empty', () => {
    const validator = SimpleField([
      rules.optional,
      () => (Promise.resolve()),
    ]);

    const journeyContext = data();
    journeyContext.getDataForPage.returns({});

    const queue = [];
    const result = queueSimpleValidator(queue, 'test-waypoint', stubPageMeta, journeyContext, 'f1', validator);

    expect(queue).to.be.empty;
    expect(result).to.be.undefined;
  });

  it('should throw an Error if validator functions are not functions', () => {
    const validator = {
      validators: ['not-a-function'],
    };

    const journeyContext = data();

    expect(() => {
      queueSimpleValidator([], 'test-waypoint', stubPageMeta, journeyContext, 'test-field', validator);
    }).to.throw(Error, 'Validator defined on \'test-field\'\' is not a function');
  });

  it('should inject the waypointId into pageMeta if pageMeta.id is undefined', async () => {
    const validator = SimpleField([
      () => (Promise.resolve()),
    ]);

    const journeyContext = data();

    const pageMeta = {
      view: 'stub-view',
    };

    const queue = [];
    queueSimpleValidator(queue, 'test-waypoint', pageMeta, journeyContext, 'f1', validator);
    await Promise.all(queue);

    expect(journeyContext.getDataForPage).to.have.been.calledOnceWithExactly({
      id: 'test-waypoint',
      view: 'stub-view',
    });
  });

  it('should not inject the waypointId into pageMeta if pageMeta.id is defined', async () => {
    const validator = SimpleField([
      () => (Promise.resolve()),
    ]);

    const journeyContext = data();

    const pageMeta = {
      id: 'already-defined',
      view: 'stub-view',
    };

    const queue = [];
    queueSimpleValidator(queue, 'test-waypoint', pageMeta, journeyContext, 'f1', validator);
    await Promise.all(queue);

    expect(journeyContext.getDataForPage).to.have.been.calledOnceWithExactly({
      id: 'already-defined',
      view: 'stub-view',
    });
  });

  it('should queue resolved Promises if all validators pass', async () => {
    const validator = SimpleField([
      () => (Promise.resolve()),
      () => (Promise.resolve()),
    ]);

    const journeyContext = data();

    const queue = [];
    queueSimpleValidator(queue, 'test-waypoint', stubPageMeta, journeyContext, 'f1', validator);
    const results = await Promise.all(queue);

    expect(queue).to.have.length(2);
    expect(results).to.deep.equal([ undefined, undefined ]);
  });

  it('should reject with a wrapped Error if validator rejects with anything other than a ValidationError', async () => {
    const validator = SimpleField([
      () => (Promise.reject('not-a-ValidationError')),
    ]);

    const journeyContext = data();

    const queue = [];
    queueSimpleValidator(queue, 'test-waypoint', stubPageMeta, journeyContext, 'f1', validator);
    const results = await Promise.all(queue);

    expect(queue).to.have.length(1);
    expect(results[0]).to.be.an('array');
    expect(results[0][0]).to.have.property('summary').that.equals('All errors must be instances of ValidationError.');
  });

  it('should embelish validator errors with field, fieldHref, validator properties', async () => {
    const validator = SimpleField([
      function namedValidator () {
        return Promise.reject(new ValidationError());
      }
    ]);

    const journeyContext = data();

    const queue = [];
    queueSimpleValidator(queue, 'test-waypoint', stubPageMeta, journeyContext, 'f1', validator);
    const results = await Promise.all(queue);

    expect(queue).to.have.length(1);
    expect(results[0]).to.be.an('array');
    expect(results[0][0]).to.have.property('field').that.equals('f1');
    expect(results[0][0]).to.have.property('fieldHref').that.equals('#f-f1');
    expect(results[0][0]).to.have.property('validator').that.equals('namedValidator');
  });

  it('should add any defined field suffix to fieldHref property', async () => {
    const validator = SimpleField([
      () => (Promise.reject(new ValidationError({
        fieldKeySuffix: '-test-suffix',
      })))
    ]);

    const journeyContext = data();

    const queue = [];
    queueSimpleValidator(queue, 'test-waypoint', stubPageMeta, journeyContext, 'f1', validator);
    const results = await Promise.all(queue);

    expect(queue).to.have.length(1);
    expect(results[0]).to.be.an('array');
    expect(results[0][0]).to.have.property('fieldHref').that.equals('#f-f1-test-suffix');
  });

  it('should add any defined focusSuffix if fieldKeySuffix property is empty', async () => {
    const validator = SimpleField([
      () => (Promise.reject(new ValidationError({
        fieldKeySuffix: '',
        focusSuffix: ['-test-focus-suffix'],
      })))
    ]);

    const journeyContext = data();

    const queue = [];
    queueSimpleValidator(queue, 'test-waypoint', stubPageMeta, journeyContext, 'f1', validator);
    const results = await Promise.all(queue);

    expect(queue).to.have.length(1);
    expect(results[0]).to.be.an('array');
    expect(results[0][0]).to.have.property('fieldHref').that.equals('#f-f1-test-focus-suffix');
    expect(results[0][0]).to.have.property('focusSuffix').that.deep.equals(['-test-focus-suffix']);
  });
});
