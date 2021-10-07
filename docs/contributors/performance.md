# Performance

## Assumptions

In many cases, NodeJS apps are served via a reverse proxy, such as Nginx. Certain functions should be offloaded to these proxies wherever possible, so assume that the following are handled elsewhere:

* gzip compression
* TLS termination
