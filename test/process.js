'use strict'

var sse     = require('sse-broadcast')(),
    app     = require('http').createServer(listener),
    args    = process.argv,
    adapter = require('../')(sse, process.env),
    port    = args[ 2 ] || 8000,
    end     = args[ 3 ] || 'unref',
    open

app.listen(port, '127.0.0.1', function () {
    adapter.sub.on('pmessage', function () {
        process.send('finish')
    })
    adapter.sub.psubscribe('*:sseb:test', function () {
        process.send('ready')
    })
})

function listener(req, res) {
    if (req.url === '/events') {
        sse.on('subscribe', function () {
            process.send('subscribe')
        })
        sse.subscribe('test', open = res)
        res.writeHead(200)
        res.flushHeaders()
    }
    else if (req.url === '/send') {
        sse.publish('test', 'test', port)
        res.end()
    }
    else if (req.url === '/close') {
        open.end()
        res.end()
    }
    else
        res.end()
}

function find(arr, expr) {
    var res = null

    arr.forEach(function (item, i) {
        var match

        if (match = item.match(expr))
            res = match
    })

    return res
}

process.on('message', function (msg) {
    if (msg !== 'close')
        return

    app.close(function () {
        // disconnect adapter
        adapter[ end ]()

        // close IPC channel
        process.disconnect()
    })
})
