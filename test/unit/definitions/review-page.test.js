const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const proxyquire = require('proxyquire');
const { request, response } = require('../helpers/express-mocks.js');
const { map, data } = require('../helpers/journey-mocks.js');

chai.use(sinonChai);

const { expect } = chai;

const reviewPage = require('../../../definitions/review-page.js');

describe('definitions: review.page', () => {
  it('must return an object', () => {
    expect(reviewPage()).to.be.an('object');
  });

  it('should add a "required" validator for the "reviewed" field', () => {
    const stubSimpleField = sinon.stub();
    const stubRules = {
      required: sinon.stub(),
    };
    const reviewPageProxy = proxyquire('../../../definitions/review-page.js', {
      '../lib/validation/index.js': {
        SimpleField: stubSimpleField,
        rules: stubRules,
      },
    });
    const output = reviewPageProxy();
    expect(output.fieldValidators).to.have.property('reviewed');
    expect(stubSimpleField).to.have.been.calledOnceWithExactly(sinon.match([
      stubRules.required,
    ]));
  });

  describe('prerender hook', () => {
    let mockRequest;
    let mockResponse;
    let stubNext;
    let prerender;

    beforeEach(() => {
      mockRequest = request();
      mockRequest.journeyActive = map();
      mockRequest.journeyData = data();
      mockResponse = response();
      mockResponse.locals.casa = {
        mountUrl: '/test-mount/',
      };
      stubNext = sinon.stub();
      prerender = reviewPage().hooks.prerender;
    });

    it('should call next middleware in chain', () => {
      prerender(mockRequest, mockResponse, stubNext);
      expect(stubNext).to.be.calledOnceWithExactly();
    });

    it('should set the correct "changeUrlPrefix" template variable', () => {
      prerender(mockRequest, mockResponse, stubNext);
      expect(mockResponse.locals).has.property('changeUrlPrefix').that.equals('/test-mount/');

      mockRequest.journeyActive.guid = 'test-guid';
      prerender(mockRequest, mockResponse, stubNext);
      expect(mockResponse.locals).has.property('changeUrlPrefix').that.equals('/test-mount/test-guid/')
    });

    it('should set the correct "journeyData" template variable', () => {
      mockRequest.journeyData.getData = sinon.stub().returns({
        test: 'data',
      });
      prerender(mockRequest, mockResponse, stubNext);
      expect(mockResponse.locals).has.property('journeyData').that.eql({
        test: 'data',
      });
    });

    it('should set the correct "reviewErrors" template variable', () => {
      mockRequest.journeyData.getValidationErrors = sinon.stub().returns('test-errors');
      prerender(mockRequest, mockResponse, stubNext);
      expect(mockResponse.locals).has.property('reviewErrors').that.eql('test-errors');
    });

    it('should set the correct "reviewBlocks" template variable', () => {
      prerender = reviewPage({
        testPage0: {
          reviewBlockView: 'test-view',
        },
        testPage1: {},
      }).hooks.prerender;
      mockRequest.editOriginUrl = 'test-origin';
      mockRequest.journeyActive.traverse = sinon.stub().returns(['testPage0', 'testPage1']);
      prerender(mockRequest, mockResponse, stubNext);
      expect(mockResponse.locals).has.property('reviewBlocks').that.deep.eql([{
        waypointId: 'testPage0',
        waypointEditUrl: '/test-mount/testPage0?edit&editorigin=test-origin',
        reviewBlockView: 'test-view',
      }]);
    });
  });
});
