'use strict'

const http = require('http')
const createHafas = require('hafas-client')
const vbbProfile = require('hafas-client/p/vbb')
const createRoundRobin = require('@derhuerst/round-robin-scheduler')

const exposeHafasClient = require('./server')
const createClient = require('./client')

// server

const httpServer = http.createServer()
httpServer.listen(3000)

const hafas = createHafas(vbbProfile, 'hafas-client-rpc example')
const server = exposeHafasClient(httpServer, hafas)

// client

const pool = createClient(createRoundRobin, [
	'ws://localhost:3000'
], (_, hafas) => {
	hafas.departures('900000009102')
	.then(console.log)
	.catch(console.error)
})
pool.on('error', console.error)
