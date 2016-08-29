'use strict'

var sse = require('sse-broadcast')(),
    app = require('http').createServer(listener),
    adt = require('../')(sse, process.env),
    end = find(process.argv, /--end-fn=(.*)/),
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

function find(arr, expr) {
    var res = null

    arr.forEach(function (item, i) {
        var match

        if (match = item.match(expr))
            res = match
    })

    return res
}

app.listen(p, function (err) {
    if (err)
        throw err

    process.send('ready')
})

process.on('message', function () {
    app.close(function () {
        // disconnect adapter
        if (end)
            adt[ end[ 1 ] ]()
        else
            adt.unref()

        // close IPC channel
        process.disconnect()
    })
})
