/**
 * Perf tests will only test single HTTP-request responses rather than the
 * delivery of a full page request including CSS, JS, etc, as much of this is
 * dependent on how the hosting service is configured. This is intended only to
 * provide an imperfect, but consistent _indicator_ of performance for purposes
 * of identifying regressions.
 *
 * As the results of these tests will vary depending on the host machine running
 * them, the expected performance metrics can be passed in via environment vars:
 *
 *  CASA_PERF_MIN_RPS = Min. requests per second expected on the host machine
 *  CASA_PERF_MAX_RES_TIME = Max. average response time (milliseconds)
 */

const { fork } = require('child_process');
const { expect } = require('chai');
const { get } = require('http');
const cheerio = require('cheerio');
const autocannon = require('autocannon');
const querystring = require('querystring');

function checkResults(err, results, done) {
  // Min. no. requests that should be served per second
  const NFR_MIN_REQ_PER_SEC = parseInt(process.env.CASA_PERF_MIN_RPS || 20, 10);

  // Max. response time (ms) per request
  const NFR_MAX_RES_TIME_MS = parseInt(process.env.CASA_PERF_MAX_RES_TIME || 500, 10);

  if (err) {
    done(err);
  } else {
    try {
      expect(results.errors).to.equal(0);
      expect(results['4xx']).to.equal(0);
      expect(results['5xx']).to.equal(0);
      expect(results.requests.average).to.be.greaterThan(NFR_MIN_REQ_PER_SEC);
      expect(results.latency.average).to.be.lessThan(NFR_MAX_RES_TIME_MS);
      done();
    } catch (ex) {
      done(ex);
    }
  }
}

describe('Server: Performance', () => {
  /* ------------------------------------------------------------------ Setup */

  const SETUP_TEARDOWN_TIMEOUT = 5000;
  const TEST_TIMEOUT = 60000;
  const SERVER_PORT = 4010;
  const PERF_CONNECTIONS = 10;
  const PERF_DURATION = 30; // seconds
  const SESSION_COOKIE_NAME = 'sessid'; // must match test-server/server.js

  // Dynamic request elements
  let server;
  let csrfToken;
  let sessionId;

  // Start test service and get CSRF token.
  // This is a real service so we can include basic network latency in our
  // tests.
  before(function beforeTests(done) {
    this.timeout(SETUP_TEARDOWN_TIMEOUT);

    server = fork('test-server/server.js', {
      cwd: __dirname,
      stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
      silent: true,
      env: {
        PORT: SERVER_PORT,
      },
    });

    server.on('message', (message) => {
      if (message === 'ready') {
        get(`http://localhost:${SERVER_PORT}/gather`, {
          timeout: 2000,
        }, (res) => {
          let body = '';
          sessionId = res.headers['set-cookie'][0].match(
            new RegExp(`^${SESSION_COOKIE_NAME}=(.+?);`),
          )[1];

          res.on('data', (chunk) => {
            body = `${body}${chunk}`;
          });
          res.on('end', () => {
            const $ = cheerio.load(body, {
              normalizeWhitespace: true,
            });
            csrfToken = $('input[name="_csrf"]').val();
            done();
          });
        });
      }
    });
  });

  // Teardown test service once tests have completed
  after(function afterTests(done) {
    this.timeout(SETUP_TEARDOWN_TIMEOUT);
    server.kill('SIGHUP');
    done();
  });

  /* ------------------------------------------------------------------ Tests */

  it('should execute performant, error-free GET requests', (done) => {
    const ac = autocannon({
      url: `http://localhost:${SERVER_PORT}/gather`,
      method: 'GET',
      connections: PERF_CONNECTIONS,
      duration: PERF_DURATION,
    }, (err, results) => {
      checkResults(err, results, done);
    });

    autocannon.track(ac, {
      renderProgressBar: false,
    });
  }).timeout(TEST_TIMEOUT);

  it('should execute performant, error-free POST requests', (done) => {
    const ac = autocannon({
      url: `http://localhost:${SERVER_PORT}/gather`,
      method: 'POST',
      connections: PERF_CONNECTIONS,
      duration: PERF_DURATION,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: `${SESSION_COOKIE_NAME}=${sessionId}`,
      },
      body: querystring.stringify({
        _csrf: csrfToken,
        field_input: 'Some input',
        'field_boxes[]': ['option0'],
        'field_date[dd]': 11,
        'field_date[mm]': '05',
        'field_date[yyyy]': 2000,
        field_radios: 'option0',
        field_textarea: 'Text area content',
      }),
    }, (err, results) => {
      checkResults(err, results, done);
    });

    autocannon.track(ac, {
      renderProgressBar: false,
    });
  }).timeout(TEST_TIMEOUT);
});
