
const chai = require('chai');
const http = require('chai-http');
const express = require('express');
const path = require('path');
const os = require('os');

const { expect } = chai;

chai.use(http);

const CasaBootstrap = require('../../casa.js');

describe('Casa Bootstrap', () => {
  let expressApp;
  let httpAgent;
  let config;

  beforeEach(() => {
    expressApp = express();
    httpAgent = chai.request.agent(expressApp);
    config = {
      compiledAssetsDir: os.tmpdir(),
      sessions: {
        secret: 'secret',
        ttl: 600,
        name: 'test',
        secure: false,
      },
      views: {
        dirs: [path.resolve(__dirname, 'testdata', 'views')],
      },
    };
  });

  afterEach(() => {
    httpAgent.app.close();
  });

  it('should add a res.locals.casa object to all responses', async () => {
    CasaBootstrap(expressApp, config);
    let resultGet;
    let resultPost;

    expressApp.get('/dummy', (req, res) => {
      resultGet = res.locals.casa;
      res.send();
    });
    expressApp.post('/dummy', (req, res) => {
      resultPost = res.locals.casa;
      res.send();
    });

    await httpAgent.get('/dummy');
    await httpAgent.post('/dummy');

    expect(resultGet).to.not.be.undefined;
    expect(resultGet).to.be.an('object');
    expect(resultPost).to.not.be.undefined;
    expect(resultPost).to.be.an('object');
  });

  it('should add a res.locals.casa.csrfToken object to all responses', async () => {
    const casa = CasaBootstrap(expressApp, config);
    let resultGet;
    let resultPost;

    expressApp.get('/dummy', casa.csrfMiddleware, (req, res) => {
      resultGet = res.locals.casa.csrfToken;
      res.send();
    });
    expressApp.post('/dummy', casa.csrfMiddleware, (req, res) => {
      resultPost = res.locals.casa.csrfToken;
      res.send();
    });

    await httpAgent.get('/dummy');
    await httpAgent.post('/dummy')
      .type('form')
      .send({
        _csrf: resultGet,
      });

    expect(resultGet).to.not.be.undefined;
    expect(resultGet).to.be.a('string');
    expect(resultPost).to.not.be.undefined;
    expect(resultPost).to.be.a('string');
  });
});
