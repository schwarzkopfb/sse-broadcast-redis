[![view on npm](http://img.shields.io/npm/v/sse-broadcast-redis.svg?style=flat-square)](https://www.npmjs.com/package/sse-broadcast-redis)
[![downloads per month](http://img.shields.io/npm/dm/sse-broadcast-redis.svg?style=flat-square)](https://www.npmjs.com/package/sse-broadcast-redis)
[![node version](https://img.shields.io/badge/node-%3E=0.12-brightgreen.svg?style=flat-square)](https://nodejs.org/download)
[![build status](https://img.shields.io/travis/schwarzkopfb/sse-broadcast-redis.svg?style=flat-square)](https://travis-ci.org/schwarzkopfb/sse-broadcast-redis)
[![test coverage](https://img.shields.io/coveralls/schwarzkopfb/sse-broadcast-redis.svg?style=flat-square)](https://coveralls.io/github/schwarzkopfb/sse-broadcast-redis)
[![license](https://img.shields.io/npm/l/sse-broadcast-redis.svg?style=flat-square)](https://github.com/schwarzkopfb/sse-broadcast-redis/blob/master/LICENSE)

# sse-broadcast-redis

Redis adapter for [sse-broadcast](https://github.com/schwarzkopfb/sse-broadcast).

SSE is a long-polling solution, consequently if you want to broadcast events to every client subscribed to a given channel then you’ll need some way of passing messages between processes or computers.
This package distributes events across nodes on top of [Redis](http://redis.io/).

## Usage

```js
const os      = require('os'),
      cluster = require('cluster')

if (cluster.isMaster)
    for (var i = os.cpus().length; i--;)
        cluster.fork()
else {
    const app = require('express')(),
          sse = require('sse-broadcast')()

    require('sse-broadcast-redis')(sse, { host: 'localhost', port: 6379 })

    app.get('/events', function (req, res) {
        sse.subscribe('channel', res)
    })

    app.post('/event', function (req, res) {
        sse.publish('channel', 'event', 'data')
        res.send()
    })

    app.listen(3333)
}
```

**Note:** options are passed to [redis](https://github.com/NodeRedis/node_redis) directly.

## API

```js
const Adapter = require('sse-broadcast-redis')
```

### Adapter(broadcaster, [clientOrOptions])

Package's main export is the adapter constructor. Its first argument is a required `Broadcaster` instance,
second is an optional redis client or an options object for `redis.createClient()`. See [redis](https://github.com/NodeRedis/node_redis) documentation regarding the available settings.

#### Adapter.Adapter

Circular reference to the adapter constructor for those who find `require('sse-broadcast-redis').Adapter` more expressive.

#### Adapter.version

The version string from package manifest.

```js
const adapter = new Adapter(broadcaster)
```

#### adapter.unref(), adapter.quit() and adapter.end([flush])

Call the [corresponding](https://github.com/NodeRedis/node_redis#clientquit)
methods of internally used redis clients.

#### Event: 'error'

Delegated `error` events of internal clients.

## Compatibility

`sse-broadcast-redis` is compatible with Node.js `0.12` and above.

## Installation

With npm:

    npm install sse-broadcast-redis

## License

[MIT](/LICENSE)
