# Writing Tests

## Where tests live

* `tests/*.test.js` files contain unit tests

* `tests/e2e/personas/` contains Persona definitions used to drive end-to-end user journeys. These are also be used to drive some non-functional tests (see further below)


## Type of tests to write

As a general rule of thumb ...

* Write **Unit Tests** for any files you create or modify in the `src/lib/` directory. These are typically classes and utility functions, and must be named with the `*.test.js` format so that they get picked up correctly by the `npm run test:unit` command.

* Write **End-to-End Tests** to cover any changes or additions to files in the `src/middleware/` and `src/routes/` directories. These are typically ExpressJS middleware functions that are often influenced by any middleware executing before them, so e2e tests ensure the full middleware chain is executed as intended. An exception to this rule is that unit tests are a better choice to cover scenarios that can't be easily triggered by an e2e tests, such as errors and exception pathways.


## Running tests

```bash
# All tests
npm test

# Unit tests
npm run test:unit
```

```bash
# e2e tests
npm run test:e2e
```

```bash
# Accessibility tests
npm run test:e2e -- --a11y
```

```bash
# Penetration tests

# Start dockerised ZAP service (wait a few seconds for this to initialise)
docker run --name zap -d -u zap -p 8080:8080 -i owasp/zap2docker-stable \
  zap.sh -daemon -host 0.0.0.0 -port 8080 \
  -config api.addrs.addr.name=".*" \
  -config api.addrs.addr.regex=true \
  -config api.key=secret

# Run tests through ZAP
npm run test:e2e -- --zap --zap-target-hostname=host.docker.internal
```


## Coverage metrics

Both unit tests and e2e tests can be leveraged to capture coverage metrics.

```bash
npm run coverage
```
