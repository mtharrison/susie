var Stream = require('stream');
var Utils = require('./utils');


exports.Transformer = function (options) {

    options = options || {};

    var stream = new Stream.Transform({
        transform: function (chunk, encoding, callback) {

            var event = {
                id: this.generateId(chunk),
                data: chunk
            };

            if (this.event) {
                event.event = this.event;
            }

            this.push(Utils.stringifyEvent(event));
            callback();
        },
        flush: function (callback) {

            this.push(Utils.stringifyEvent({ event: 'end', data: '' }));
            callback();
        }
    });

    stream.counter = 1;
    stream.event = options.event || null;
    stream.generateId = options.generateId || function () {

        return this.counter++;
    };

    return stream;
};
