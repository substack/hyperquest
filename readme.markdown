# hreq

treat http requests as a streaming transport

The hreq api is a subset of [request](https://github.com/mikeal/request).

# rant

This module disables a lot of infuriating things about core http that WILL cause
bugs in your application if you think of http as just another kind of stream:

* http requests have a default idle timeout of 2 minutes. This is terrible if
you just want to pipe together a bunch of persistent backend processes over
http.

* There is a default connection pool of 5 requests. If you have 5 or more extant
http requests, any additional requests will HANG for NO GOOD REASON.

hreq turns these annoyances off so you can just pretend that core http is just a
fancier version of tcp and not the horrible monstrosity that it actually is.

I have it on good authority that these annoyances will be fixed in node 0.10.

# example

# simple streaming GET

``` js
var hreq = require('hreq');
hreq('http://localhost:8000').pipe(process.stdout);
```

```
$ node example/req.js
beep boop
```

# methods

``` js
var hreq = require('hreq');
```

## var req = hreq(uri, opts={}, cb)

Create an outgoing http request to `uri` or `opts.uri`.
You need not pass any arguments here since there are setter methods documented
below.

Return a readable or duplex stream depending on the `opts.method`.

Default option values:

* opts.method - `"GET"`
* opts.headers - `{}`
* opts.auth - undefined, but is set automatically when the `uri` has an auth
string in it such as `"http://user:passwd@host"`.

The request does not go through until the `nextTick` so you can set values
outside of the `opts` so long as they are called on the same tick.

Optionally you can pass a `cb(err, res)` to set up listeners for `'error'` and
`'response'` events in one place.

## req.setHeader(key, value);

Set an outgoing header `key` to `value`.

## req.setLocation(uri);

Set the location if you didn't specify it in the `hreq()` call.

## var req = hreq.get(uri, opts, cb)

Return a readable stream from `hreq(..., { method: 'GET' })`.

## var req = hreq.put(uri, opts, cb)

Return a duplex stream from `hreq(..., { method: 'PUT' })`.

## var req = hreq.post(uri, opts, cb)

Return a duplex stream from `hreq(..., { method: 'POST' })`.

## var req = hreq.delete(uri, opts, cb)

Return a readable stream from `hreq(..., { method: 'DELETE' })`.

# events

## req.on('response', function (res) {})

The `'response'` event is forwarded from the underlying `http.request()`.

## req.on('error', function (res) {})

The `'error'` event is forwarded from the underlying `http.request()`.

# install

With [npm](https://npmjs.org) do:

```
npm install hreq
```

# license

MIT
