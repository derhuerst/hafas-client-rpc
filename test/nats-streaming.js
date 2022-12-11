'use strict'

const assert = require('assert')

const exposeHafasClientViaNatsStreaming = require('../nats-streaming/server')
const createNatsStreamingClient = require('../nats-streaming/client')

const departures = (id) => {
	assert.strictEqual('string', typeof id)
	assert.ok(!!id)
	return Promise.resolve([])
}
const mockHafas = {departures}

const onError = (err) => {
	console.error(err)
	process.exitCode = 1
}

const server = exposeHafasClientViaNatsStreaming(mockHafas, onError)
server.on('error', onError)

const client = createNatsStreamingClient((_, hafas) => {
	hafas.departures('900000009102')
	.then((res) => {
		assert.ok(Array.isArray(res))
		console.info('nats-streaming adapter works ✔︎')

		client.close()
		server.close()
	})
	.catch(onError)
})
client.on('error', onError)
