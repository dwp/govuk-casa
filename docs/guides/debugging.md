# Debugging

## Logging

Your first port of call when debugging a problem is to turn on logging, which can be done via the `DEBUG` environment variable. This will turn on _all_ logging:

```bash
# Enable debugging; this will show _all_ casa framework logs
export DEBUG=casa*

# Start your app
npm start
```

You can pinpoint specific log levels using the `casa:*:<level>` format. For example, you might use something like this in production:

```bash
export DEBUG=casa:*:warn,casa:*:error,casa:*:fatal
```

If you're interested in a specific file, it's useful to know that casa uses the debug prefix syntax `path:to:file` for any logs related to a specific file. For example, to capture logs from the `src/middleware/session.js` file, you'd use:

```bash
export DEBUG=casa:middleware:session*
```

Read more about the **[debug](https://www.npmjs.com/package/debug)** module.
