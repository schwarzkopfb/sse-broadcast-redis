'use strict'

var EE      = require('events').EventEmitter,
    test    = require('tap'),
    redis   = require('redis'),
    sse     = require('sse-broadcast'),
    Adapter = require('../'),
    client  = redis.createClient(),
    adapter = new Adapter(sse(), client)

function noop() {}

test.type(Adapter, 'function', 'main export should be a constructor')
test.ok(adapter instanceof EE, 'instace should be an EventEmitter')

adapter.once('error', function (err) {
    test.type(err, Error, 'redis client errors should be delegated')
    // ignore other errors
    adapter.on('error', noop)
    adapter.end()
})
