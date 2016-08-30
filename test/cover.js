'use strict'

var resolve = require('path').resolve,
    spawn   = require('child_process').spawn,
    open    = require('opener'),
    rmrf    = require('rimraf'),
    exec    = process.execPath,
    dir     = resolve(__dirname, '..'),
    cdir    = resolve(dir, 'coverage'),
    fnTests = [ 'unref', 'quit', 'end' ]

rmrf.sync(cdir)
doBasicTests(function () {
    doTest('api.js', finish)
})

function doBasicTest(endFn, cb) {
    var test = spawn(exec, [ resolve(__dirname, 'basic.js'), 'cover', endFn ], { stdio: 'inherit' })

    test.on('error', cb)
        .on('close', onclose(cb))
}

function doBasicTests(cb, i) {
    if (i === undefined)
        i = 0

    doBasicTest(fnTests[ i++ ], function (err) {
        if (err)
            throw err
        else if (i < fnTests.length)
            doBasicTests(cb, i)
        else
            cb()
    })
}

function doTest(file, cb) {
    var test = spawn('./node_modules/.bin/istanbul', [
        'cover',
        '--report', 'none',
        '--print', 'none',
        '--include-pid',
        resolve(__dirname, file)
    ])

    test.on('error', onerror)
        .on('close', onclose(cb))
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
          })
}
