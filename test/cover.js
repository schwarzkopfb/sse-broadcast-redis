'use strict'

var resolve = require('path').resolve,
    spawn   = require('child_process').spawn,
    open    = require('opener'),
    rmrf    = require('rimraf'),
    exec    = process.execPath,
    dir     = resolve(__dirname, '..'),
    cdir    = resolve(dir, 'coverage'),
    tests   = [ 'unref', 'quit', 'end' ]

rmrf.sync(cdir)
doTests(finish)

function doTest(endFn, cb) {
    var test = spawn(exec, [ resolve(__dirname, 'basic.js'), '--cov', '--end-fn=' + endFn ])

    test.on('error', cb)
        .on('close', onclose(cb))
}

function doTests(cb, i) {
    if (i === undefined)
        i = 0

    doTest(tests[ i++ ], function (err) {
        if (err)
            throw err
        else if (i < tests.length)
            doTests(cb, i)
        else
            cb(null)
    })
}

function onerror(err) {
    throw err
}

function onclose(cb) {
    return function (code, signal) {
        if (code != 0)
            cb(new Error('non-zero exit code: ' + code + ', signal: ' + signal))
        else
            cb(null)
    }
}

function finish() {
    var report = spawn(resolve(__dirname, '../node_modules/.bin/istanbul'), [ 'report', 'lcov', '--dir', cdir ])

    report.on('error', onerror)
          .on('close', function () {
              open(resolve(cdir, 'lcov-report/index.html'))

              // todo: coveralls upload
          })
}
