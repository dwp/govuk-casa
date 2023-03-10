# Example: Barebones

If using this for local framework development purposes:

```bash
# Install the framework first
npm ci
npm link

# Install and run this example
cd examples/barebones/
npm i
npm link @dwp/govuk-casa
DEBUG=casa* PORT=3000 npm start
```

Visit <http://localhost:3000/barebones/>
