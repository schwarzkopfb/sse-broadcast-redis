'use strict'

var env = process.env

module.exports = {
    port:     env.REDIS_PORT,
    host:     env.REDIS_HOST,
    password: env.REDIS_PASSWORD
}
