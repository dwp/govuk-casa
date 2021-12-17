# Example: Multiple CASA sub-apps

This example demonstrate how you might configure multiple CASA applications all within the same "parent" ExpressJS application.

This creates two Plans and intersects them as so:

```
# Plan 1
A -> B -> C ... F -> G

# Plan 2
D -> E

# Combined journey as experienced by the user
A -> B -> C -> D -> E -> F -> G
```

For simplicity, each app in this example is entirely separate, but you could configure them to use a shared `views/` directory in order to share things like layout templates and a `locales/` directory for shared locales, for example.

Potential use cases for this pattern:

* "Hub and Spoke" navigation pattern, where each Plan represents an isolated gathering journey
* Where parts of your user journey require the user to repeatedly enter new data items in a sub-section of your Plan, you could isolate those sections as separate sub-apps and clear them down prior to sending the user back through that section again.


## Running the example

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

Visit http://localhost:3000/multiapp/main/
