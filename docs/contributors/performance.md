# Performance


## Assumptions

In many cases, NodeJS apps are served via a reverse proxy, such as Nginx. Certain functions should be offloaded to these proxies wherever possible, so assume that the following are handled elsewhere in the application stack and do not need to be handled by the CASA framework:

* gzip compression
* TLS termination


## Performance

Iterating over arrays/objects:

* `for` loops with a cached length variable are the quickest way to iterate over arrays
* `Object.values()` is quickest way to iterate over objects if you don't care about the keys
* `Object.keys()` is the quickest and safest way to iterate over objects if you need the key
* `Object.entries()` is the _slowest_ method to iterate an object

References:

- https://www.realpythonproject.com/javascript-do-you-know-the-fastest-way-to-iterate-over-arrays-objects/
