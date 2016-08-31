'use strict'

var EE      = require('events').EventEmitter,
    AE      = require('assert').AssertionError,
    test    = require('tap'),
    redis   = require('redis'),
    sse     = require('sse-broadcast')(),
    Adapter = require('../'),
    client  = redis.createClient(),
    adapter = new Adapter(sse, client)

function noop() {}

test.plan(11)

test.type(Adapter, 'function', 'main export should be a constructor')
test.type(Adapter.Adapter, 'function', 'constructor should be exposed as `Adapter`')
test.equal(Adapter.Adapter, Adapter, '`Adapter` ref should equal to main export')
test.equal(Adapter.version, require('../package.json').version, 'version should be exposed correctly')
test.ok(adapter instanceof EE, 'instace should be an EventEmitter')
test.type(adapter.unref, 'function', 'instance should have an `unref()` method')
test.type(adapter.quit, 'function', 'instance should have an `quit()` method')
test.type(adapter.end, 'function', 'instance should have an `end()` method')
test.equal(adapter.end.length, 1, '`end()` method should accept `flush` argument')

test.test('constructor signatures', function (test) {
    test.throws(function () {
        new Adapter
    }, AE, 'constructor args should be asserted')
    test.throws(function () {
        new Adapter(true)
    }, AE, 'constructor args should be asserted')
    test.throws(function () {
        new Adapter({})
    }, AE, 'constructor args should be asserted')
    test.doesNotThrow(function () {
        new Adapter(sse).end()
    }, 'valid constructor args should be accepted')
    test.doesNotThrow(function () {
        new Adapter(sse, { host: '127.0.0.1', port: 1234 }).end()
    }, 'valid constructor args should be accepted')
    test.doesNotThrow(function () {
        new Adapter(sse, client).end()
    }, 'valid constructor args should be accepted')

    test.end()
})

test.test('error delegation', function (test) {
    adapter.once('error', function (err) {
        test.type(err, Error, 'redis client errors should be delegated')
        adapter.end()
        test.end()
    })
})
