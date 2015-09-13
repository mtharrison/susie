var Stream = require('stream');
var PassThrough = Stream.PassThrough;
var Transform = require('./transform').Transform;
var Utils = require('./utils');

var internals = {};

internals.handleEvent = function (event, options, streamOptions) {

    var stream;
    var resp;

    this.request.plugins.susie = this.request.plugins.susie || {};

    if (event instanceof Stream.Readable) {
        stream = new Transform(streamOptions);
        event.pipe(stream);
        this(stream).header('content-type', 'text/event-stream');
        return;
    }

    if (!this.request.plugins.susie.stream) {
        stream = new PassThrough();
        this.request.plugins.susie.stream = stream;
        this(stream).header('content-type', 'text/event-stream');
        if (event) {
            stream.write(Utils.stringifyEvent(event));
        } else {
            stream.end();
        }
        return;
    }

    stream = this.request.plugins.susie.stream;
    if (event) {
        stream.write(Utils.stringifyEvent(event));
    } else {
        stream.end();
    }
};


exports.register = function (server, options, next) {

    server.decorate('reply', 'event', internals.handleEvent);
    next();
};


exports.register.attributes = require('../package');
