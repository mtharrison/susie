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

    beforeEach((done) => {

        server = new Hapi.Server();
        server.connection({ port: 4000 });
        server.register(require('../'), (err) => {

            if (err){
                throw err;
            }

            done();
        });
    });

    it('Sets the proper headers for SSE', (done) => {

        server.route([{
            method: 'GET',
            path: '/',
            handler: function (request, reply) {

                reply.event(null);
            }
        }]);

        server.inject('http://localhost:4000/', (res) => {

            expect(res.headers['content-type']).to.equal('text/event-stream; charset=utf-8');
            expect(res.headers['cache-control']).to.equal('no-cache');
            expect(res.headers['content-encoding']).to.equal('identity');
            done();
        });
    });

    it('Allows sending events as objects', (done) => {

        server.route([{
            method: 'GET',
            path: '/',
            handler: function (request, reply) {

                reply.event({ data: 'abcdef' });
                reply.event({ data: 'ghijkl' });
                reply.event({ data: 'mnopqr' });
                reply.event(null);
            }
        }]);

        server.inject('http://localhost:4000/', (res) => {

            expect(res.headers['content-type']).to.equal('text/event-stream; charset=utf-8');
            expect(res.payload).to.equal('data: abcdef\r\n\r\ndata: ghijkl\r\n\r\ndata: mnopqr\r\n\r\nevent: end\r\ndata: \r\n\r\n');
            done();
        });
    });

    it('Allows sending events as objects with embedded object data', (done) => {

        server.route([{
            method: 'GET',
            path: '/',
            handler: function (request, reply) {

                reply.event({ data: { a: 'abcdef' } });
                reply.event({ data: { a: 'ghijkl' } });
                reply.event({ data: { a: 'mnopqr' } });
                reply.event(null);
            }
        }]);

        server.inject('http://localhost:4000/', (res) => {

            expect(res.headers['content-type']).to.equal('text/event-stream; charset=utf-8');
            expect(res.payload).to.equal('data: {\"a\":\"abcdef\"}\r\n\r\ndata: {\"a\":\"ghijkl\"}\r\n\r\ndata: {\"a\":\"mnopqr\"}\r\n\r\nevent: end\r\ndata: \r\n\r\n');
            done();
        });
    });

    it('Handles `id` and `event` fields', (done) => {

        server.route([{
            method: 'GET',
            path: '/',
            handler: function (request, reply) {

                reply.event({ id: 1, event: 'update', data: 'abcdef' });
                reply.event(null);
            }
        }]);

        server.inject('http://localhost:4000/', (res) => {

            expect(res.headers['content-type']).to.equal('text/event-stream; charset=utf-8');
            expect(res.payload).to.equal('id: 1\r\nevent: update\r\ndata: abcdef\r\n\r\nevent: end\r\ndata: \r\n\r\n');
            done();
        });
    });

    it('Allows sending a stream of strings', (done) => {

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
            handler: function (request, reply) {

                reply.event(stream);
            }
        }]);

        server.inject('http://localhost:4000/', (res) => {

            expect(res.headers['content-type']).to.equal('text/event-stream; charset=utf-8');
            expect(res.payload).to.equal('id: 1\r\ndata: abcdef\r\n\r\nid: 2\r\ndata: ghijkl\r\n\r\nevent: end\r\ndata: \r\n\r\n');
            done();
        });
    });

    it('Allows sending a stream of buffers', (done) => {

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
            handler: function (request, reply) {

                reply.event(stream);
            }
        }]);

        server.inject('http://localhost:4000/', (res) => {

            expect(res.headers['content-type']).to.equal('text/event-stream; charset=utf-8');
            expect(res.payload).to.equal('id: 1\r\ndata: abcdef\r\n\r\nid: 2\r\ndata: ghijkl\r\n\r\nevent: end\r\ndata: \r\n\r\n');
            done();
        });
    });

    it('Allows you to set an event type when using a stream', (done) => {

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
            handler: function (request, reply) {

                reply.event(stream, null, { event: 'update' });
            }
        }]);

        server.inject('http://localhost:4000/', (res) => {

            expect(res.headers['content-type']).to.equal('text/event-stream; charset=utf-8');
            expect(res.payload).to.equal('id: 1\r\ndata: abcdef\r\nevent: update\r\n\r\nid: 2\r\ndata: ghijkl\r\nevent: update\r\n\r\nevent: end\r\ndata: \r\n\r\n');
            done();
        });
    });

    it('Allows you to set an id generator function using a stream', (done) => {

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
            handler: function (request, reply) {

                const generateId = function (chunk) {

                    return chunk.toString('base64');
                };

                reply.event(stream, null, { event: 'update', generateId: generateId });
            }
        }]);

        server.inject('http://localhost:4000/', (res) => {

            expect(res.headers['content-type']).to.equal('text/event-stream; charset=utf-8');
            expect(res.payload).to.equal('id: YWJjZGVm\r\ndata: abcdef\r\nevent: update\r\n\r\nid: Z2hpamts\r\ndata: ghijkl\r\nevent: update\r\n\r\nevent: end\r\ndata: \r\n\r\n');
            done();
        });
    });

    it('Works with streams in object mode', (done) => {

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
            handler: function (request, reply) {

                reply.event(stream);
            }
        }]);

        server.inject('http://localhost:4000/', (res) => {

            expect(res.headers['content-type']).to.equal('text/event-stream; charset=utf-8');
            expect(res.payload).to.equal('id: 1\r\ndata: {"a":1,"b":"2"}\r\n\r\nid: 2\r\ndata: {"a":3,"b":"4"}\r\n\r\nevent: end\r\ndata: \r\n\r\n');
            done();
        });
    });
});
