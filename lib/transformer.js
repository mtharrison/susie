var Stream = require('stream');
var Transform = Stream.Transform;
var Util = require('util');
var Utils = require('./utils');


var internals = {};


internals.Transformer = exports.Transformer = function (options, objectMode) {

    options = options || {};
    this.counter = 1;
    this.event = options.event || null;
    this.generateId = options.generateId || function () {

        return this.counter++;
    };
    Transform.call(this, { objectMode: objectMode });
};


Util.inherits(exports.Transformer, Transform);


internals.Transformer.prototype._transform = function (chunk, encoding, callback) {

    var event = {
        id: this.generateId(chunk),
        data: chunk
    };

    if (this.event) {
        event.event = this.event;
    }

    this.push(Utils.stringifyEvent(event));
    callback();
};


internals.Transformer.prototype._flush = function (callback) {

    this.push(Utils.stringifyEvent({ event: 'end', data: '' }));
    callback();
};
