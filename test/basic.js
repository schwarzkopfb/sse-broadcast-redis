'use strict'

var http  = require('http'),
    join  = require('path').join,
    child = require('child_process'),
    test  = require('tap'),
    cred  = require('./credentials'),
    proc1 = fork(8000),
    proc2 = fork(8001),
    rc    = 0 // ready proc counter

test.plan(1)
boot()

function fork(port) {
    var path = join(__dirname, 'process.js'),
        opts = { env: cred, stdio: 'inherit' },
        args = [ port, process.argv[ 3 ] || '' ],
        proc

    if (process.argv[ 2 ] === 'cover')
        proc = child.fork('./node_modules/.bin/istanbul', [
            'cover',
            '--report', 'none',
            '--print', 'none',
            '--include-pid',
            path, '--'
        ].concat(args), opts)
    else
        proc = child.fork(path, args, opts)

    proc.port = port
    return proc
}

function wait(child, message, cb) {
    child.once('message', function (msg) {
        if (msg === message)
            cb()
    })
}

function onready() {
    if (++rc === 2)
        start()
}

function boot() {
    wait(proc1, 'ready', onready)
    wait(proc2, 'ready', onready)
}

function get(child, path, cb) {
    http.get('http://127.0.0.1:' + child.port + path, function (res) {
        var data = ''
        res.setEncoding('utf8')
        res.on('data', function (chunk) {
            data += chunk
        })
        res.on('end', function () {
            cb && cb(data)
        })
    })
}

function start() {
    wait(proc1, 'subscribe', function () {
        wait(proc1, 'finish', function () {
            get(proc1, '/close')
        })
        get(proc2, '/send')
    })
    get(proc1, '/events', function (data) {
        test.equal(data, 'event: test\ndata: 8001\n\n')
        finish()
    })
}

function finish() {
    proc1.send('close')
    proc2.send('close')
}
