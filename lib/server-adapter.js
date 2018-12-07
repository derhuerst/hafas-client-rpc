'use strict'

const jsonrpc = require('jsonrpc-lite')
const omit = require('lodash.omit')

const paramsNotAnArray = new jsonrpc.JsonRpcError(`\
params must be an array`, '1')

const createServerAdapter = (hafas) => {
	const onMessage = (msg, respond) => {
		const req = jsonrpc.parse(msg)
		if (!req || req.type !== 'request' || !req.payload) return;
		const {id, method, params} = req.payload

		const onError = (err) => {
			const msg = err && err.message || (err + '')
			const data = omit(Object.assign({}, err), ['message', 'code'])
			const wrapped = new jsonrpc.JsonRpcError(msg, err.code || '3', data)
			respond(jsonrpc.error(id, wrapped))
		}
		try {
			if ('function' !== typeof hafas[method]) {
				throw new jsonrpc.JsonRpcError(`invalid method "${method}"`, '2')
			}
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

	return onMessage
}

module.exports = createServerAdapter
