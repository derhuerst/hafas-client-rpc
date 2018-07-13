'use strict'

const http = require('http')
const createHafas = require('hafas-client')
const vbbProfile = require('hafas-client/p/vbb')

const exposeHafasClient = require('./server')
const createClient = require('./client')

// server

const httpServer = http.createServer()
httpServer.listen(3000)

const hafas = createHafas(vbbProfile)
const server = exposeHafasClient(httpServer, hafas)

// client

const onError = console.error

createClient('ws://localhost:3000', onError, (hafas) => {
	hafas.departures('900000009102')
	.then(console.log)
	.catch(console.error)
})
