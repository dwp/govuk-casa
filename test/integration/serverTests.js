const express = require('express');
const os = require('os');
const http = require('chai-http');
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const path = require('path');
const casa = require('../../casa.js');

const { expect } = chai;
chai.use(sinonChai);

// Test defaults
const config = {
  mountUrl: '/',
  views: { dirs: [] },
  compiledAssetsDir: os.tmpdir(),
  sessions: {
    name: 'example',
    secret: 'SuperSecretSecret',
    ttl: 60 * 60,
    secure: false,
  },
};

// Sample mount controller
function mountController(callback) {
  const { expressApp } = this;

  // Middleware 1
  expressApp.use((req, res, next) => {
    res.header('has-run-middleware-1', true);
    next();
  });

  // Middleware 1
  expressApp.use((req, res, next) => {
    res.header('has-run-middleware-2', true);
    next();
  });

  // Run common middleware
  callback();

  // Middleware 3
  expressApp.use((req, res, next) => {
    res.header('has-run-middleware-3', true);
    next();
  });

  // Middleware 4
  expressApp.use((req, res, next) => {
    res.header('has-run-middleware-4', true);
    next();
  });
}

chai.use(http);

describe('Server: Config', () => {
  let app;
  let agent;

  beforeEach(() => {
    app = express();
    agent = chai.request.agent(app);
    config.mountController = mountController;

    // Spy on process.exit to test invalid config
    sinon.stub(process, 'exit');
  });

  afterEach(() => {
    process.exit.restore();
    agent.app.close();
  });

  describe('GET /', () => {
    describe('With middleware configured', () => {
      it('All middleware configured and running', async () => {
        casa(app, config);
        const response = await agent.get('/');

        expect(response.headers['has-run-middleware-1']).to.equal('true');
        expect(response.headers['has-run-middleware-2']).to.equal('true');
        expect(response.headers['has-run-middleware-3']).to.equal('true');
        expect(response.headers['has-run-middleware-4']).to.equal('true');
      });
    });

    describe('Without middleware configured', async () => {
      it('No headers added', async () => {
        config.mountController = callback => callback();

        casa(app, config);
        const response = await agent.get('/');

        expect(response.headers['has-run-middleware-1']).to.equal(undefined);
        expect(response.headers['has-run-middleware-2']).to.equal(undefined);
        expect(response.headers['has-run-middleware-3']).to.equal(undefined);
        expect(response.headers['has-run-middleware-4']).to.equal(undefined);
      });

      it('No headers added (missing controller)', async () => {
        delete config.mountController;

        casa(app, config);
        const response = await agent.get('/');

        expect(response.headers['has-run-middleware-1']).to.equal(undefined);
        expect(response.headers['has-run-middleware-2']).to.equal(undefined);
        expect(response.headers['has-run-middleware-3']).to.equal(undefined);
        expect(response.headers['has-run-middleware-4']).to.equal(undefined);
      });

      it('Application exits (invalid controller)', async () => {
        config.mountController = false;

        casa(app, config);
        expect(process.exit).called;
      });
    });

    describe('Separation of template data', () => {
      it('should use the correct language in overlapping requests', async () => {
        // Scenario:
        // - Request A arrives and sets request language to 'en'
        // - Request B arrives and sets request language to 'cy'
        // - Request B completes and renders
        // - Request A completes and renders

        // Use test views and locales
        const cfg = Object.assign({}, config, {
          views: {
            dirs: [path.resolve(__dirname, 'testdata', 'views')],
          },
          i18n: {
            dirs: [path.resolve(__dirname, 'testdata', 'locales')],
            locales: ['en', 'cy'],
          },
        });
        delete cfg.mountController;
        casa(app, cfg);

        // Dummy handler
        app.get('/', (req, res, next) => {
          res.render('i18n-test.njk', {
            teststring: 'test:test1',
          });

          if (req.query.lang && req.query.lang === 'cy') {
            next();
          } else {
            // This delay mimics a longer running request, to give chance for
            // requests to overlap
            setTimeout(next, 1000);
          }
        });

        const responses = await Promise.all([
          agent.get('/'),
          agent.get('/?lang=cy'),
        ]);

        expect(responses[0].text).to.equal('TEST 1 EN');
        expect(responses[1].text).to.equal('TEST 1 CY');
      });
    });
  });
});
