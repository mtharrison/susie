var Stream = require('stream');
var PassThrough = Stream.PassThrough;
var Transform = Stream.Transform;
var Util = require('util');
var Utils = require('./utils');

exports.Transform = function (options) {

    options = options || {};
    this.counter = 1;
    this.event = options.event || 'message';
    Transform.call(this);
};


Util.inherits(exports.Transform, Transform);


exports.Transform.prototype._transform = function (chunk, encoding, callback) {

    this.push(Utils.stringifyEvent({
        id: this.counter,
        data: chunk.toString(),
        event: this.event
    }));
    this.counter++;
    callback();
};
