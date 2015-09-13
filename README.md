# susie [![Build Status](https://travis-ci.org/mtharrison/susie.svg)](https://travis-ci.org/mtharrison/susie)

##Overview

This is a plugin that adds simple Server-Sent Events (aka EventSource) capabilities to hapi. It decorates the `reply()` interface with a new method `reply.event()`. You can send individual events as objects, or you can simply pass a stream and some options and susie will make things work as you expect.

You probably already know this but install it with: `npm install --save susie`

##Usage

First load and register the plugin:

```javascript
server.register(require('susie'), function (err) {
    ...
});
```

#### With event objects

In a route handler you can now call `reply.event()` to start an SSE response:

```javascript
server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {

        reply.event({ data: 'my data' });
    }
});
```

The first time you call `reply.event()`, appropriate HTTP response headers will be sent, along with your first event. Subsequent calls to `reply.event()` will send more events.

```javascript
server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {

        reply.event({ id: 1, data: 'my data' });

        setTimeout(function () {

            reply.event({ id: 2, data: { a: 1 } }); // object datum
        }, 500);
    }
});
```
If any of your datum are objects, they will be stringified for you. Make sure to parse them again in the client, if you're expecting JSON.

#### With a readable stream

A really nice way to provide an EventSource is using a ReadableStream. This is really simple with Susie. Just call `reply.event(stream)`. The stream should not be in `objectMode`:

```javascript
var externalSource = new PassThrough();
var i = 0;

setInterval(function () {

    i++;
    externalSource.write(i.toString());
}, 100);

server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {

        reply.event(stream);
    }
});
```
Each chunk coming off the stream will be sent as an event. The content of the chunk will be the data parameter. You can provide an optional `event` option and `id` generator. By default the id will be the number of chunks received:

```javascript
server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {

        var i = 0;
        var generateId = function (chunk) { return i += 10; }
        reply.event(stream, null, { event: 'update', generateId: generateId });
    }
});
```
