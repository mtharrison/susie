'use strict';

// Load modules

const Code = require('code');
const Hapi = require('hapi');
const Lab = require('lab');
const PassThrough = require('stream').PassThrough;


// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;
const beforeEach = lab.beforeEach;


describe('susie', () => {

    let server;

    beforeEach(async () => {

        server = Hapi.server({ port: 4000 });
        await server.register(require('../'));
    });

    it('Sets the proper headers for SSE', async () => {

        server.route({
            method: 'GET',
            path: '/',
            handler: function (request, h) {

                return h.event(null);
            }
        });

        const res = await server.inject('http://localhost:4000/');

        expect(res.headers['content-type']).to.equal('text/event-stream; charset=utf-8');
        expect(res.headers['cache-control']).to.equal('no-cache');
        expect(res.headers['content-encoding']).to.equal('identity');
    });

    it('Allows sending events as objects', async () => {

        server.route({
            method: 'GET',
            path: '/',
            handler: function (request, h) {

                const response = h.event({ data: 'abcdef' });
                h.event({ data: 'ghijkl' });
                h.event({ data: 'mnopqr' });
                h.event(null);

                return response;
            }
        });

        const res = await server.inject('http://localhost:4000/');

        expect(res.headers['content-type']).to.equal('text/event-stream; charset=utf-8');
        expect(res.payload).to.equal('data: abcdef\r\n\r\ndata: ghijkl\r\n\r\ndata: mnopqr\r\n\r\nevent: end\r\ndata: \r\n\r\n');
    });

    it('Allows sending events as objects with embedded object data', async () => {

        server.route([{
            method: 'GET',
            path: '/',
            handler: function (request, h) {

                const response = h.event({ data: { a: 'abcdef' } });
                h.event({ data: { a: 'ghijkl' } });
                h.event({ data: { a: 'mnopqr' } });
                h.event(null);

                return response;
            }
        }]);

        const res = await server.inject('http://localhost:4000/');

        expect(res.headers['content-type']).to.equal('text/event-stream; charset=utf-8');
        expect(res.payload).to.equal('data: {\"a\":\"abcdef\"}\r\n\r\ndata: {\"a\":\"ghijkl\"}\r\n\r\ndata: {\"a\":\"mnopqr\"}\r\n\r\nevent: end\r\ndata: \r\n\r\n');
    });

    it('Handles `id` and `event` fields', async () => {

        server.route([{
            method: 'GET',
            path: '/',
            handler: function (request, h) {

                const response = h.event({ id: 1, event: 'update', data: 'abcdef' });
                h.event(null);

                return response;
            }
        }]);

        const res = await server.inject('http://localhost:4000/');

        expect(res.headers['content-type']).to.equal('text/event-stream; charset=utf-8');
        expect(res.payload).to.equal('id: 1\r\nevent: update\r\ndata: abcdef\r\n\r\nevent: end\r\ndata: \r\n\r\n');
    });

    it('Allows sending a stream of strings', async () => {

        const stream = new PassThrough();

        setTimeout(() => {

            stream.write('abcdef');
            setTimeout(() => {

                stream.write('ghijkl');
                stream.end();
            }, 100);
        }, 100);

        server.route([{
            method: 'GET',
            path: '/',
            handler: function (request, h) {

                return h.event(stream);
            }
        }]);

        const res = await server.inject('http://localhost:4000/');

        expect(res.headers['content-type']).to.equal('text/event-stream; charset=utf-8');
        expect(res.payload).to.equal('id: 1\r\ndata: abcdef\r\n\r\nid: 2\r\ndata: ghijkl\r\n\r\nevent: end\r\ndata: \r\n\r\n');
    });

    it('Allows sending a stream of buffers', async () => {

        const stream = new PassThrough();

        setTimeout(() => {

            stream.write(new Buffer('abcdef'));
            setTimeout(() => {

                stream.write(new Buffer('ghijkl'));
                stream.end();
            }, 100);
        }, 100);

        server.route([{
            method: 'GET',
            path: '/',
            handler: function (request, h) {

                return h.event(stream);
            }
        }]);

        const res = await server.inject('http://localhost:4000/');

        expect(res.headers['content-type']).to.equal('text/event-stream; charset=utf-8');
        expect(res.payload).to.equal('id: 1\r\ndata: abcdef\r\n\r\nid: 2\r\ndata: ghijkl\r\n\r\nevent: end\r\ndata: \r\n\r\n');
    });

    it('Allows you to set an event type when using a stream', async () => {

        const stream = new PassThrough();

        setTimeout(() => {

            stream.write('abcdef');
            setTimeout(() => {

                stream.write('ghijkl');
                stream.end();
            }, 100);
        }, 100);

        server.route([{
            method: 'GET',
            path: '/',
            handler: function (request, h) {

                return h.event(stream, null, { event: 'update' });
            }
        }]);

        const res = await server.inject('http://localhost:4000/');

        expect(res.headers['content-type']).to.equal('text/event-stream; charset=utf-8');
        expect(res.payload).to.equal('id: 1\r\ndata: abcdef\r\nevent: update\r\n\r\nid: 2\r\ndata: ghijkl\r\nevent: update\r\n\r\nevent: end\r\ndata: \r\n\r\n');
    });

    it('Allows you to set an id generator function using a stream', async () => {

        const stream = new PassThrough();

        setTimeout(() => {

            stream.write('abcdef');
            setTimeout(() => {

                stream.write('ghijkl');
                stream.end();
            }, 100);
        }, 100);

        server.route([{
            method: 'GET',
            path: '/',
            handler: function (request, h) {

                const generateId = function (chunk) {

                    return chunk.toString('base64');
                };

                return h.event(stream, null, { event: 'update', generateId });
            }
        }]);

        const res = await server.inject('http://localhost:4000/');

        expect(res.headers['content-type']).to.equal('text/event-stream; charset=utf-8');
        expect(res.payload).to.equal('id: YWJjZGVm\r\ndata: abcdef\r\nevent: update\r\n\r\nid: Z2hpamts\r\ndata: ghijkl\r\nevent: update\r\n\r\nevent: end\r\ndata: \r\n\r\n');
    });

    it('Works with streams in object mode', async () => {

        const stream = new PassThrough({ objectMode: true });

        setTimeout(() => {

            stream.write({ a: 1, b: '2' });
            setTimeout(() => {

                stream.write({ a: 3, b: '4' });
                stream.end();
            }, 100);
        }, 100);

        server.route([{
            method: 'GET',
            path: '/',
            handler: function (request, h) {

                return h.event(stream);
            }
        }]);

        const res = await server.inject('http://localhost:4000/');

        expect(res.headers['content-type']).to.equal('text/event-stream; charset=utf-8');
        expect(res.payload).to.equal('id: 1\r\ndata: {"a":1,"b":"2"}\r\n\r\nid: 2\r\ndata: {"a":3,"b":"4"}\r\n\r\nevent: end\r\ndata: \r\n\r\n');
    });
});
