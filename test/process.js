'use strict'

var sse = require('sse-broadcast')(),
    app = require('http').createServer(listener),
    adt = require('../')(sse, process.env),
    p   = process.env.http_port,
    tmp

function listener(req, res) {
    if (req.url === '/events') {
        sse.subscribe('test', tmp = res)
        sse.publish('test', 'test', p)
    }
    else if (req.url === '/send') {
        sse.publish('test', 'test', p)
        res.end()
    }
    else if (req.url === '/close') {
        tmp.end()
        res.end()
    }
    else
        res.end()
}

app.listen(p, function () {
    process.send('ready')
})

process.on('message', function () {
    app.close(function () {
        // disconnect adapter
        adt.unref()
        // close IPC channel
        process.disconnect()
    })
})
