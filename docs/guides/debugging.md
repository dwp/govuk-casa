# Debugging

## Logging

Your first port of call when debugging a problem is to turn on logging, which can be done via the `DEBUG` environment variable. This will turn on _all_ logging:

```bash
# Enable debugging
export DEBUG=casa*

# Start your app
npm start
```

If you're interested in a specific file, it's useful to know that casa uses the debug prefix syntax `path:to:file` for any logs related to a specific file. For e3xample, to capture logs from the `src/middleware/session.js` file, you'd use:

```bash
export DEBUG=casa:middleware:session*
```
