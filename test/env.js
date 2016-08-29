'use strict'

if (require.main === module)
    return require('tap').pass()

var env = process.env

module.exports = function(port) {
    return {
        port:      env.REDIS_PORT,
        host:      env.REDIS_HOST,
        password:  env.REDIS_PASSWORD,
        http_port: port
    }
}
