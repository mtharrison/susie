var Stream = require('stream');
var PassThrough = Stream.PassThrough;
var Transformer = require('./transformer').Transformer;
var Utils = require('./utils');

var internals = {};


internals.writeEvent = function (event, stream) {

    if (event) {
        stream.write(Utils.stringifyEvent(event));
    } else {
        // closing time
        stream.write(Utils.stringifyEvent({ event: 'end', data: '' }));
        stream.end();
    }
};


internals.handleEvent = function (event, options, streamOptions) {

    var stream;
    var resp;

    var state = this.request.plugins.susie = this.request.plugins.susie || {};

    // handle a stream arg

    if (event instanceof Stream.Readable) {

        state.mode = 'stream';

        if (event._readableState.objectMode) {
            var through = new Transformer(streamOptions, true);
            stream = new PassThrough();
            through.pipe(stream);
            event.pipe(through);
        } else {
            stream = new Transformer(streamOptions, false);
            event.pipe(stream);
        }

        this(stream).header('content-type', 'text/event-stream');
        return;
    }

    // handle a first object arg

    if (!state.stream) {
        stream = new PassThrough();
        state.stream = stream;
        state.mode = 'object';
        this(stream).header('content-type', 'text/event-stream');
        internals.writeEvent(event, stream);
        return;
    }

    // already have an object stream flowing, just write next event

    stream = state.stream;
    internals.writeEvent(event, stream);
};


exports.register = function (server, options, next) {

    server.decorate('reply', 'event', internals.handleEvent);
    next();
};


exports.register.attributes = {
    pkg: require('../package')
};
