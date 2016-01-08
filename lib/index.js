'use strict';

const Stream = require('stream');
const PassThrough = Stream.PassThrough;
const Transformer = require('./transformer').Transformer;
const Utils = require('./utils');

const internals = {};


internals.writeEvent = function (event, stream) {

    if (event) {
        stream.write(Utils.stringifyEvent(event));
    }
    else {
        // closing time
        stream.write(Utils.stringifyEvent({ event: 'end', data: '' }));
        stream.end();
    }
};


internals.handleEvent = function (event, options, streamOptions) {

    let stream;

    const state = this.request.plugins.susie = this.request.plugins.susie || {};

    // handle a stream arg

    if (event instanceof Stream.Readable) {

        state.mode = 'stream';

        if (event._readableState.objectMode) {
            const through = new Transformer(streamOptions, true);
            stream = new PassThrough();
            through.pipe(stream);
            event.pipe(through);
        }
        else {
            stream = new Transformer(streamOptions, false);
            event.pipe(stream);
        }

        this(stream)
            .header('content-type', 'text/event-stream')
            .header('content-encoding', 'identity');
        return;
    }

    // handle a first object arg

    if (!state.stream) {
        stream = new PassThrough();
        state.stream = stream;
        state.mode = 'object';
        this(stream)
            .header('content-type', 'text/event-stream')
            .header('content-encoding', 'identity');
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
