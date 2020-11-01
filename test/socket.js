'use strict'

const assert = require('assert')

const exposeHafasClientViaSockets = require('../socket/server')
const createSocketsClient = require('../socket/client')

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

const {
	close: closeServer,
} = exposeHafasClientViaSockets(mockHafas, (err) => {
	if (err) onError(err)

	const {
		close: closeClient,
	} = createSocketsClient((err, hafas) => {
		if (err) onError(err)

		hafas.departures('900000009102')
		.then((res) => {
			assert.ok(Array.isArray(res))
			closeClient()
			closeServer()
		})
		.catch(onError)
	})
})
