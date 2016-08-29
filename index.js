'use strict'

exports = module.exports = SSEBroadcasterRedisAdapter

var assert      = require('assert'),
    redis       = require('redis'),
    id          = require('mdbid'),
    Broadcaster = require('sse-broadcast')

function SSEBroadcasterRedisAdapter(broadcaster, options) {
    if (!(this instanceof SSEBroadcasterRedisAdapter))
        return new SSEBroadcasterRedisAdapter(broadcaster, options)

    assert(broadcaster, 'a broadcaster instance is required')
    assert(
        broadcaster instanceof Broadcaster,
        'broadcaster must be an instance of SSEBroadcaster'
    )

    this.id = id()
    this.clients = {
        pub: redis.createClient(options),
        sub: redis.createClient(options)
    }
    this.broadcaster = broadcaster

    broadcaster.on('publish', this.onpublish.bind(this))
    broadcaster.on('subscribe', this.onsubscribe.bind(this))
    broadcaster.on('unsubscribe', this.onunsubscribe.bind(this))

    this.clients.sub.on('pmessage', this.onpmessage.bind(this))
}

SSEBroadcasterRedisAdapter.prototype.onpmessage = function onpmessage(pattern, channel, message) {
    var id = channel.substring(0, 24)

    // we've got back our own message
    if (this.id === id)
        return

    message = JSON.parse(message)
    message.emit = false
    this.broadcaster.publish(channel.substring(30), message)
}

SSEBroadcasterRedisAdapter.prototype.onpublish = function onpublish(name, message) {
    this.clients.pub.publish(this.id + ':sseb:' + name, JSON.stringify(message))
}

SSEBroadcasterRedisAdapter.prototype.onsubscribe = function onsubscribe(name) {
    this.clients.sub.psubscribe('*:sseb:' + name)
}

SSEBroadcasterRedisAdapter.prototype.onunsubscribe = function onunsubscribe(name) {
    this.clients.sub.punsubscribe('*:sseb:' + name)
}

SSEBroadcasterRedisAdapter.prototype.quit = function quit() {
    this.clients.pub.quit()
    this.clients.sub.quit()
}

SSEBroadcasterRedisAdapter.prototype.unref = function unref() {
    this.clients.pub.unref()
    this.clients.sub.unref()
}

SSEBroadcasterRedisAdapter.prototype.end = function end(flush) {
    this.clients.pub.end(flush)
    this.clients.sub.end(flush)
}
