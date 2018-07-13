'use strict'

const {Server} = require('ws')
const jsonrpc = require('jsonrpc-lite')

const paramsNotAnArray = new jsonrpc.JsonRpcError(`\
params must be an array`, '1')
const invalidMethod = new jsonrpc.JsonRpcError(`\
invalid method`, '2')

const exposeHafasClient = (httpServer, hafas) => {
	const wsServer = new Server({server: httpServer})

	const onRequest = (req, respond) => {
		if (!req || req.type !== 'request' || !req.payload) return;
		const {id, method, params} = req.payload

		const onError = (err) => {
			const msg = err && err.message || (err + '')
			err = new jsonrpc.JsonRpcError(msg, err.code || '3')
			respond(jsonrpc.error(id, err))
		}
		try {
			if ('function' !== typeof hafas[method]) throw invalidMethod
			if (!Array.isArray(params)) throw paramsNotAnArray

			hafas[method](...params)
			.then((res) => {
				respond(jsonrpc.success(id, res))
			})
			.catch(onError)
		} catch (err) {
			onError(err)
		}
	}

	wsServer.on('connection', (client) => {
		const respond = msg => client.send(msg + '')

		client.on('message', (msg) => {
			const req = jsonrpc.parse(msg)
			onRequest(req, respond)
		})
	})

	return wsServer
}

module.exports = exposeHafasClient
