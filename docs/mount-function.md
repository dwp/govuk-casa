# The `mount()` function

In the most basic scenario, you'd mount your CASA app as follows:

```javascript
const { mount } = configure({ ... });
const app = express();

app.use('/', mount(express()));
```

But the `mount()` function also support a few options that can affect how your app is mounted under the hood ...

* `mount(app, { route: '/:id' })` can be used to mount your app under a [paramaterised route](docs/guides/parameterised-mount.md)
* `mount(app, { serveFirstWaypoint: true })` can be used to ensure the first waypoint in your Plan is served when `/` is visited (see below)

## Auto-serving the first Plan waypoint

If you were to mount your app as so ...

```javascript
app.use('/', mount(express()));
```

Then when a user visits your service at `https://localhost/`, then they'd be presented with a 404. This is because CASA does not, by default, serve the first waypoint in your Plan.

To have CASA service the first waypoint for you, simply pass the `serveFirstWaypoint` flag:

```javascript
app.use('/', mount(express(), { serveFirstWaypoint: true }));
```
