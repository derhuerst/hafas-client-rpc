'use strict'

const jsonrpc = require('jsonrpc-lite')
const omit = require('lodash.omit')
const {
	extractCachingFields,
	embedCachingFields,
} = require('./caching-fields')

const addCachingFieldsToOpt = (msg, params) => {
	const opt = params[params.length - 1]
	if ('object' !== typeof opt || opt === null) return;
	extractCachingFields(msg, opt)
}

const paramsNotAnArray = new jsonrpc.JsonRpcError(`\
params must be an array`, '1')

const createServerAdapter = (hafas) => {
	const onMessage = (msg, respond) => {
		const req = jsonrpc.parse(msg)
		if (!req || req.type !== 'request' || !req.payload) return;
		const {id, method, params} = req.payload
		addCachingFieldsToOpt(msg, params) // mutates opt param!

		const onError = (err) => {
			const msg = err && err.message || (err + '')
			const data = omit(err, [
				'message', 'code',
				// todo: add simplified versions of err.request & err.response?
				'request', 'response',
			])
			const wrapped = new jsonrpc.JsonRpcError(msg, err.code || '3', data)
			respond(jsonrpc.error(id, wrapped).serialize())
		}
		try {
			if ('function' !== typeof hafas[method]) {
				throw new jsonrpc.JsonRpcError(`invalid method "${method}"`, '2')
			}
			if (!Array.isArray(params)) throw paramsNotAnArray

			hafas[method](...params)
			.then((res) => {
				const msg = embedCachingFields(
					jsonrpc.success(id, res).serialize(),
					res,
				)
				respond(msg)
			})
			.catch(onError)
		} catch (err) {
			onError(err)
		}
	}

	return onMessage
}

module.exports = createServerAdapter
