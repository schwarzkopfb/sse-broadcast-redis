'use strict'

exports = module.exports = SSEBroadcasterRedisAdapter

var assert       = require('assert'),
    inherits     = require('util').inherits,
    EventEmitter = require('events'),
    redis        = require('redis'),
    id           = require('mdbid'),
    Broadcaster  = require('sse-broadcast')

function SSEBroadcasterRedisAdapter(broadcaster, optionsOrClient) {
    if (!(this instanceof SSEBroadcasterRedisAdapter))
        return new SSEBroadcasterRedisAdapter(broadcaster, optionsOrClient)

    assert(broadcaster, 'a broadcaster instance is required')
    assert(
        broadcaster instanceof Broadcaster,
        'broadcaster must be an instance of SSEBroadcaster'
    )

    this.id          = id()
    this.broadcaster = broadcaster

    if (optionsOrClient instanceof redis.RedisClient) {
        this.pub = optionsOrClient
        this.sub = optionsOrClient.duplicate()
    }
    else {
        this.pub = redis.createClient(optionsOrClient)
        this.sub = redis.createClient(optionsOrClient)
    }

    broadcaster.on('publish', this.onpublish.bind(this))
    broadcaster.on('subscribe', this.onsubscribe.bind(this))
    broadcaster.on('unsubscribe', this.onunsubscribe.bind(this))

    this.pub.on('error', this.onerror.bind(this))
    this.sub.on('error', this.onerror.bind(this))
    this.sub.on('pmessage', this.onpmessage.bind(this))
}

inherits(SSEBroadcasterRedisAdapter, EventEmitter)

SSEBroadcasterRedisAdapter.prototype.onerror = function onerror(err) {
    this.emit('error', err)
}

SSEBroadcasterRedisAdapter.prototype.onpmessage = function onpmessage(pattern, channel, message) {
    var id = channel.substring(0, 24)

    // we've got back our own message
    if (this.id === id)
        return

    message = JSON.parse(message)
    // do not re-emit this publish
    // (and start an infinite ping-pong match)
    message.emit = false
    this.broadcaster.publish(channel.substring(30), message)
}

SSEBroadcasterRedisAdapter.prototype.onpublish = function onpublish(name, message) {
    this.pub.publish(this.id + ':sseb:' + name, JSON.stringify(message))
}

SSEBroadcasterRedisAdapter.prototype.onsubscribe = function onsubscribe(name) {
    this.sub.psubscribe('*:sseb:' + name)
}

SSEBroadcasterRedisAdapter.prototype.onunsubscribe = function onunsubscribe(name) {
    if (!this.broadcaster.subscriberCount(name))
        this.sub.punsubscribe('*:sseb:' + name)
}

SSEBroadcasterRedisAdapter.prototype.quit = function quit() {
    this.pub.quit()
    this.sub.quit()
}

SSEBroadcasterRedisAdapter.prototype.unref = function unref() {
    this.pub.unref()
    this.sub.unref()
}

SSEBroadcasterRedisAdapter.prototype.end = function end(flush) {
    this.pub.end(flush)
    this.sub.end(flush)
}
