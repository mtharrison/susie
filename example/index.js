var Hapi = require('hapi');
var Path = require('path');
var PassThrough = require('stream').PassThrough;

var server = new Hapi.Server();
server.connection({ port: 4000 });

server.register([require('inert'), require('..')], function (err) {

    if (err) {
        throw err;
    }

    server.route({
        method: 'GET',
        path: '/',
        handler: {
            file: Path.join(__dirname, 'index.html')
        }
    });

    // plain-mode: emit low level events

    server.route({
        method: 'GET',
        path: '/plain',
        handler: function (request, reply) {

            reply.event({ id: 1, data: 'my data' });

            setTimeout(function () {

                reply.event({ id: 2, data: { a: 1 } });
                reply.event(null);
            }, 500);
        }
    });

    // stream-mode: just pass a stream

    server.route({
        method: 'GET',
        path: '/stream',
        handler: function (request, reply) {

            var externalSource = new PassThrough();
            var i = 0;

            var timer = setInterval(function () {

                i++;
                externalSource.write(i.toString());
                if (i >= 20) {
                    externalSource.end();
                    clearInterval(timer);
                }
            }, 100);

            var j = 0;
            var generateId = function (chunk) {

                j += 10;
                return j;
            };
            reply.event(externalSource, null, { event: 'update', generateId: generateId });
        }
    });

    server.start(function (err) {

        if (err) {
            throw err;
        }

        console.log('Server started!');
    });
});
