'use strict'

var http  = require('http'),
    child = require('child_process'),
    test  = require('tap'),
    env   = require('./env'),
    ctr   = 0,
    ended,
    c1, c2

function fork(port) {
    var path = __dirname + '/process.js',
        opts = { env: env(port) }

    if (~process.argv.indexOf('--cov'))
        return child.fork('./node_modules/.bin/istanbul', [
            'cover',
            '--report', 'none',
            '--print', 'none',
            '--include-pid',
            path, '--'
        ].concat(process.argv.slice(2)), opts)
    else
        return child.fork(path, opts)
}

function get(port, path, cb) {
    http.get('http://127.0.0.1:' + port + path, function (res) {
        res.body = ''
        res.on('data', function (chunk) {
            res.body += chunk.toString('utf8')
        })
        cb(res)
    })
}

function wait(child) {
    child.on('message', function () {
        if (++ctr === 2)
            ready()
    })
}

function ready() {
    get(8000, '/events', function (stream) {
        stream.on('end', function () {
            test.equal(stream.body, 'event: test\ndata: 8000\n\n')
            done()
        })

        get(8001, '/send', function (res) {
            res.on('end', function () {
                get(8000, '/close', function (res) {
                    res.on('end', done)
                })
            })
        })
    })
}

function done() {
    if (ended)
        close()
    else
        ended = true
}

function close() {
    c1.send('close')
    c2.send('close')
}

test.plan(1)

c1 = fork(8000)
c2 = fork(8001)

wait(c1)
wait(c2)
