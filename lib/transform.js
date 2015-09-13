var Stream = require('stream');
var PassThrough = Stream.PassThrough;
var Transform = Stream.Transform;
var Util = require('util');
var Utils = require('./utils');

exports.Transform = function (options) {

    options = options || {};
    this.counter = 1;
    this.event = options.event || null;
    this.generateId = options.generateId || function () {

        return this.counter++;
    };
    Transform.call(this);
};


Util.inherits(exports.Transform, Transform);


exports.Transform.prototype._transform = function (chunk, encoding, callback) {

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


exports.Transform.prototype._flush = function (callback) {

    this.push(Utils.stringifyEvent({ event: 'end', data: '' }));
    callback();
};
