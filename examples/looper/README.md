# Example: Looper

This demonstrates how to put an app together to make use of the `@dwp/casa-looper-plugin` plugin.

```bash
npm i
DEBUG=casa* npm start
```

Visit http://localhost:3000/


## Local development

If using this for local framework development purposes:

```bash
# Install the framework first
npm ci
npm link

# Install and run this example
cd examples/looper/
npm i
npm link @dwp/govuk-casa
DEBUG=casa* npm start
```

Visit http://localhost:3000/
