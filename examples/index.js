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
        path: '/{p*}',
        handler: {
            directory: {
                path: Path.join(__dirname, 'public')
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/stocks',
        handler: function (request, reply) {

            var stream = new PassThrough();
            setInterval(function () {

                stream.write((500 + Math.floor(Math.random() * 100)).toString());
            }, 200);
            reply.event(stream, null, { event: 'update' });
        }
    });

    server.start(function (err) {

        if (err) {
            throw err;
        }

        console.log('Server started!');
    });
});
