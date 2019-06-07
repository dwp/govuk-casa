const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const { expect } = chai;
chai.use(sinonChai);

const { request, response } = require('../../helpers/express-mocks.js');

const mwTimeout = require('../../../../middleware/session/timeout.js');

describe('Middleware: session/timeout', () => {
  let mockRequest;
  let mockResponse;
  let stubNext;

  beforeEach(() => {
    mockRequest = request();
    mockResponse = response();
    stubNext = sinon.stub();
  });

  it('should render the casa/session-timeout.njk page with ttl in minutes', () => {
    const middleware = mwTimeout(1800);
    middleware(mockRequest, mockResponse, stubNext);
    return expect(mockResponse.render).to.be.calledOnceWithExactly(
      'casa/session-timeout.njk',
      {
        sessionTtl: 30,
      },
    );
  });

  it('should round the ttl down to nearest minute', () => {
    const middleware = mwTimeout(119);
    middleware(mockRequest, mockResponse, stubNext);
    return expect(mockResponse.render).to.be.calledOnceWithExactly(
      'casa/session-timeout.njk',
      {
        sessionTtl: 1,
      },
    );
  });
});
