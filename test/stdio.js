'use strict'

const assert = require('assert')

const createStdioClient = require('../stdio/client')

const onError = (err) => {
	console.error(err)
	process.exitCode = 1
}

const pathToMockServer = require.resolve('./stdio-mock-server')

const facade = createStdioClient(pathToMockServer, (_, hafas) => {
	hafas.departures('900000009102')
	.then((res) => {
		assert.deepStrictEqual(res, ['mock'])
		facade.close()
	})
	.catch(onError)
})
