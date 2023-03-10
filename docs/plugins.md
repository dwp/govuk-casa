# Plugins

This document describes how to use plugins and how to write your own.

## Using a plugin

Depending on the plugins you use, there are usually 2 steps needed to include them in your application: initialising the plugin, and altering template(s).

First, load the plugin:

```javascript
import somePlugin from 'somewhere';

configure({
  plugins: [
    somePlugin(),
  ],
});
```

Secondly - if the plugin requires it - make the necessary changes to your Nunjucks templates, as instructed.

## Initialisation phases

There are two phases during which a plugin establishes itself in the application:

* A **configure** phase which allows the plugin to manipulate the raw configuration passed in by the application developer, and
* A **bootstrap** phase during which the plugin can manipulate the CASA Nunjucks environment, routers or middleware

## Configure phase

Your plugin _may_ expose a `configure()` method that accepts and manipulates a configuration object passed in by the application developer. This method is expected to have side-effects as it modifies the passed config variable directly.

For example, to add some extra template directories you may do something like this:

```javascript
function configure(config) {
  config.views.push('path/to/my/views/directory');
}
```

## Bootstrap phase

Once CASA has done its own setup, it will have created several artifacts that can now be manipulated by your plugin. You can do so by exposing a `bootstrap()` function.

For example, to add your own generic information page to the `ancillaryRouter`:

```javascript
function bootstrap({ ancillaryRouter }) {
  ancillaryRouter.get('/info', (req, res, next) => {
    res.render('info.njk');
  });
}
```

All artifacts returned by the `configure()` function are available to your `bootstrap()` function.

## Injecting content into templates

CASA uses a specialised template loader for its Nunjucks environment, which is a lightweight wrapper around the bundled `FileSystemLoader` loader. This exposes functionality that lets you intercept the template source and manipulate it before it reaches the renderer.

To hook into this mechanism, you need to provide that loader with a list of templates you are interested in manipulating:

```javascript
function bootstrap({ nunjucksEnv }) {
  // This will insert some content at the end of the named block. It will be
  // inserted into the first occurrence of this block as that is usually the
  // most specific, and overrides any other uses of the same block elsewhere.
  nunjucksEnv.modifyBlock('blockName', () => {
    return 'This will add some content from another template at the beginning of the blockName block: {% include "my-plugin/thing.njk" %}';
  });

  // !!!!! `modifyTemplate()` NOT YET IMPLEMENTED !!!!!

  // // This has access to the whole template source, which you can modify freely
  // nunjucksEnv.modifyTemplate('template-name.njk', (source) => {
  //   source += '{% block head %} Completely override the head block {% endblock %}';
  //   return source;
  // });
}
```

This design was settled on as having the best chance of injecting content into the right place, so is the default behaviour. If we instead used a **pull** approach - where a series of hooks we included in each block, e.g. `{% block body %} {{ pullContentHere() }} {% endblock %}` - then there would be no guarantee that any overrides of that block would still include that pull function.

However, it isn't foolproof, so all plugins should be sure to offer both this automatic insertion behaviour, but also a manual insertion option so developers can inject the content in exactly the right place as they wish. The convention for this is to support a `disableContentModification` option, and accompanying documentation on how to manually inject the content instead. For example:

```javascript
configure({
  plugins: [
    somePlugin({
      disableContentModification: true,
    }),
  ],
});
```

## Supporting CommonJS and ES6

As CASA applications can be written using ESM or CommonJS modules, it's important that your plugins also provide this facility.

You may wish to adopt the pattern used in the core framework, but it's not mandatory.
