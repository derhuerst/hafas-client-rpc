'use strict'

const {strictEqual} = require('assert')
const {
	CACHED, CACHE_TIME,
	encodeCachingFields,
	decodeCachingFields,
} = require('../lib/caching-fields')
const createServerAdapter = require('../lib/server-adapter')
const createClientAdapter = require('../lib/client-adapter')

require('./ws')
require('./stdio')
require('./socket')
require('./nats-streaming')

;(async () => {
	const ID = '123'
	const OPT = {foo: 'bar'}
	Object.defineProperty(OPT, CACHED, {value: false})

	const opt2 = decodeCachingFields(encodeCachingFields(OPT))
	strictEqual(opt2[CACHED], false)

	const hafas = {
		departures: async (id, opt) => {
			strictEqual(id, ID)
			strictEqual(opt[CACHED], false)
			const res = []
			Object.defineProperty(res, CACHE_TIME, {value: 123})
			return res
		},
	}
	const serverOnMessage = createServerAdapter(hafas)
	const sendToClient = msg => clientOnMessage(msg, {})
	const sendToServer = msg => serverOnMessage(msg, sendToClient)
	const {
		facade: client,
		onMessage: clientOnMessage
	} = createClientAdapter(sendToServer)
	const res = await client.departures(ID, OPT)
	strictEqual(res[CACHE_TIME], 123)

	console.info('passes through cached-hafas-client Symbols ✔︎')
})()
.catch((err) => {
	console.error(err)
	process.exit(1)
})
