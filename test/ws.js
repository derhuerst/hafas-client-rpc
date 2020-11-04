'use strict'

const http = require('http')
const assert = require('assert')
const createRoundRobin = require('@derhuerst/round-robin-scheduler')

const exposeHafasClientViaWebSockets = require('../ws/server')
const createWebSocketsClient = require('../ws/client')

const departures = (id) => {
	assert.strictEqual('string', typeof id)
	assert.ok(!!id)
	return Promise.resolve([])
}
const mockHafas = {departures}

const httpServer = http.createServer()
httpServer.listen(3000)
const server = exposeHafasClientViaWebSockets(httpServer, mockHafas)

const onError = (err) => {
	console.error(err)
	process.exitCode = 1
}

const pool = createWebSocketsClient(createRoundRobin, [
	'ws://localhost:3000'
], (_, hafas) => {
	hafas.departures('900000009102')
	.then((res) => {
		assert.ok(Array.isArray(res))
		console.info('ws adapter works ✔︎')

		pool.close()
		httpServer.close()
	})
	.catch(onError)
})
pool.on('error', onError)
