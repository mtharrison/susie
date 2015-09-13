// Load modules

var Code = require('code');
var Hapi = require('hapi');
var Lab = require('lab');
var PassThrough = require('stream').PassThrough;

// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var expect = Code.expect;
var beforeEach = lab.beforeEach;


describe('susie', function () {

    var server;

    beforeEach(function (done) {

        server = new Hapi.Server();
        server.connection({ port: 4000 });
        server.register(require('../'), function (err) {

            done();
        });
    });

    it('Sets the proper headers for SSE', function (done) {

        server.route([{
            method: 'GET',
            path: '/',
            handler: function (request, reply) {

                reply.event(null);
            }
        }]);

        server.inject('http://localhost:4000/', function (res) {

            expect(res.headers['content-type']).to.equal('text/event-stream; charset=utf-8');
            expect(res.headers['cache-control']).to.equal('no-cache');
            done();
        });
    });

    it('Allows sending events as objects', function (done) {

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

        server.inject('http://localhost:4000/', function (res) {

            expect(res.headers['content-type']).to.equal('text/event-stream; charset=utf-8');
            expect(res.payload).to.equal('data: abcdef\r\n\r\ndata: ghijkl\r\n\r\ndata: mnopqr\r\n\r\nevent: end\r\ndata: \r\n\r\n');
            done();
        });
    });

    it('Allows sending events as objects with embedded object data', function (done) {

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

        server.inject('http://localhost:4000/', function (res) {

            expect(res.headers['content-type']).to.equal('text/event-stream; charset=utf-8');
            expect(res.payload).to.equal('data: {\"a\":\"abcdef\"}\r\n\r\ndata: {\"a\":\"ghijkl\"}\r\n\r\ndata: {\"a\":\"mnopqr\"}\r\n\r\nevent: end\r\ndata: \r\n\r\n');
            done();
        });
    });

    it('Handles `id` and `event` fields', function (done) {

        server.route([{
            method: 'GET',
            path: '/',
            handler: function (request, reply) {

                reply.event({ id: 1, event: 'update', data: 'abcdef' });
                reply.event(null);
            }
        }]);

        server.inject('http://localhost:4000/', function (res) {

            expect(res.headers['content-type']).to.equal('text/event-stream; charset=utf-8');
            expect(res.payload).to.equal('id: 1\r\nevent: update\r\ndata: abcdef\r\n\r\nevent: end\r\ndata: \r\n\r\n');
            done();
        });
    });

    it('Allows sending a stream of strings', function (done) {

        var stream = new PassThrough();

        setTimeout(function () {

            stream.write('abcdef');
            setTimeout(function () {

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

        server.inject('http://localhost:4000/', function (res) {

            expect(res.headers['content-type']).to.equal('text/event-stream; charset=utf-8');
            expect(res.payload).to.equal('id: 1\r\ndata: abcdef\r\n\r\nid: 2\r\ndata: ghijkl\r\n\r\nevent: end\r\ndata: \r\n\r\n');
            done();
        });
    });

    it('Allows sending a stream of buffers', function (done) {

        var stream = new PassThrough();

        setTimeout(function () {

            stream.write(new Buffer('abcdef'));
            setTimeout(function () {

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

        server.inject('http://localhost:4000/', function (res) {

            expect(res.headers['content-type']).to.equal('text/event-stream; charset=utf-8');
            expect(res.payload).to.equal('id: 1\r\ndata: abcdef\r\n\r\nid: 2\r\ndata: ghijkl\r\n\r\nevent: end\r\ndata: \r\n\r\n');
            done();
        });
    });

    it('Allows you to set an event type when using a stream', function (done) {

        var stream = new PassThrough();

        setTimeout(function () {

            stream.write('abcdef');
            setTimeout(function () {

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

        server.inject('http://localhost:4000/', function (res) {

            expect(res.headers['content-type']).to.equal('text/event-stream; charset=utf-8');
            expect(res.payload).to.equal('id: 1\r\ndata: abcdef\r\nevent: update\r\n\r\nid: 2\r\ndata: ghijkl\r\nevent: update\r\n\r\nevent: end\r\ndata: \r\n\r\n');
            done();
        });
    });

    it('Allows you to set an id generator function using a stream', function (done) {

        var stream = new PassThrough();

        setTimeout(function () {

            stream.write('abcdef');
            setTimeout(function () {

                stream.write('ghijkl');
                stream.end();
            }, 100);
        }, 100);

        server.route([{
            method: 'GET',
            path: '/',
            handler: function (request, reply) {

                var generateId = function (chunk) {

                    return chunk.toString('base64');
                };

                reply.event(stream, null, { event: 'update', generateId: generateId });
            }
        }]);

        server.inject('http://localhost:4000/', function (res) {

            expect(res.headers['content-type']).to.equal('text/event-stream; charset=utf-8');
            expect(res.payload).to.equal('id: YWJjZGVm\r\ndata: abcdef\r\nevent: update\r\n\r\nid: Z2hpamts\r\ndata: ghijkl\r\nevent: update\r\n\r\nevent: end\r\ndata: \r\n\r\n');
            done();
        });
    });

    it('Works with streams in object mode', function (done) {

        var stream = new PassThrough({ objectMode: true });

        setTimeout(function () {

            stream.write({ a: 1, b: '2' });
            setTimeout(function () {

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

        server.inject('http://localhost:4000/', function (res) {

            expect(res.headers['content-type']).to.equal('text/event-stream; charset=utf-8');
            expect(res.payload).to.equal('id: 1\r\ndata: {"a":1,"b":"2"}\r\n\r\nid: 2\r\ndata: {"a":3,"b":"4"}\r\n\r\nevent: end\r\ndata: \r\n\r\n');
            done();
        });
    });
});
