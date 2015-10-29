# SuSiE - Server-Sent Events with hapi
[![Build Status](https://travis-ci.org/mtharrison/susie.svg)](https://travis-ci.org/mtharrison/susie)

![](http://cl.ly/image/403X2e1R2T29/Untitled3.gif)

_Above example under `/examples`. Start with `npm start`_

This is a plugin that adds simple Server-Sent Events (aka EventSource) capabilities to hapi. It decorates the `reply()` interface with a new method `reply.event()`. You can send individual events as objects, or you can simply pass a stream and some options and SuSiE will make things work as you expect.

You probably already know this but install it with: `npm install --save susie`

## Usage

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

A really nice way to provide an EventSource is using a ReadableStream. This is really simple with SuSiE. Just call `reply.event(stream)`:

```javascript
server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {

        var Readable = require('stream').Readable;
        var rs = Readable();

        var c = 97;
        rs._read = function () {
            rs.push(String.fromCharCode(c++));
            if (c > 'z'.charCodeAt(0)) rs.push(null);
        };

        reply.event(rs);
    }
});
```
![http://cl.ly/d5XT/Screen%20Shot%202015-09-13%20at%2015.50.25.png](http://cl.ly/d5XT/Screen%20Shot%202015-09-13%20at%2015.50.25.png)

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
**Object mode streams**

If the stream is in `objectMode`, each object that comes off the stream will be stringified and the resulting string will be used as the `data` parameter. See example under `examples` for example.

## Considerations

#### How do I finish a SSE stream for good?

In the SSE spec, it says that when the HTTP response ends, the browser will try to reconnect, sending another request to the endpoint. You may want this. Or you may really want to stop to the events being streamed altogether.

When you call `reply.event(null)` or your stream emits its `end` event, the HTTP response will conclude. However, SuSiE will send one last event to the browser before it closes. You should listen for this `end` event in your client code and close the EventSource, before the browser attempts to reconnect:

```html
<script>
    var source = new EventSource('/events');
    ...
    source.addEventListener('end', function (event) {
    
        this.close();
    });
</script>
