'use strict';

const Hapi = require('hapi');
const Path = require('path');
const PassThrough = require('stream').PassThrough;

const server = new Hapi.Server();
server.connection({ port: 4000 });

server.register([require('inert'), require('..')], (err) => {

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

            const stream = new PassThrough({ objectMode: true });
            setInterval(() => {

                stream.write({ name: 'BDGRS', price: (500 + Math.floor(Math.random() * 100)).toString(), order: Math.floor(Math.random() * 2) === 1 ? 'BUY' : 'SELL' });
                stream.write({ name: 'MSHRM', price: (120 + Math.floor(Math.random() * 200)).toString(), order: Math.floor(Math.random() * 2) === 1 ? 'BUY' : 'SELL' });
                stream.write({ name: 'ASNKE', price: (900 + Math.floor(Math.random() * 50)).toString(), order: Math.floor(Math.random() * 2) === 1 ? 'BUY' : 'SELL' });
            }, 200);
            reply.event(stream, null, { event: 'stock' });
        }
    });

    server.start((err) => {

        if (err) {
            throw err;
        }

        console.log('Server started!');
    });
});
