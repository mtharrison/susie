var Stream = require('stream');
var PassThrough = Stream.PassThrough;
var Transform = Stream.Transform;
var Util = require('util');

var internals = {};


internals.stringifyEvent = function (event) {

    var str = '';
    const endl = '\r\n';
    for (var i in event) {
        var val = event[i];
        if (typeof val === 'object') {
            val = JSON.stringify(val);
        }
        str += i + ': ' + val + endl;
    }
    str += endl;

    return str;
};


internals.Transform = function (options) {

    options = options || {};
    this.counter = 1;
    this.event = options.event || 'message';
    Transform.call(this);
};


Util.inherits(internals.Transform, Transform);


internals.Transform.prototype._transform = function (chunk, encoding, callback) {

    debugger;

    this.push(internals.stringifyEvent({
        id: this.counter,
        data: chunk.toString(),
        event: this.event
    }));
    this.counter++;
    callback();
};


internals.handleEvent = function (event, options) {

    var stream;
    var resp;

    this.request.plugins.susie = this.request.plugins.susie || {};

    if (event instanceof Stream.Readable) {
        stream = new internals.Transform(options);
        event.pipe(stream);
        resp = this(stream);
        return resp.header('content-type', 'text/event-stream');
    }
    else if (!this.request.plugins.susie.stream) {
        stream = new PassThrough();
        this.request.plugins.susie.stream = stream;
        resp = this(stream);
        resp.header('content-type', 'text/event-stream');
    } 
    else {
        stream = this.request.plugins.susie.stream;
    }

    stream.write(internals.stringifyEvent(event));
};


exports.register = function (server, options, next) {

    server.decorate('reply', 'event', internals.handleEvent);
    next();
};

exports.register.attributes = require('../package');
