'use strict'

const client = require('./ws/client')
const server = require('./ws/server')
const stdioClient = require('./stdio/client')
const stdioServer = require('./stdio/server')

// todo: remove this file
module.exports = {client, server, stdioClient, stdioServer}
