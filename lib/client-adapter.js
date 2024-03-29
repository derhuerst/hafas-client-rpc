'use strict'

const {parse, request} = require('jsonrpc-lite')
const customInspect = require('util').inspect.custom
const debug = require('debug')('hafas-client-rpc:client-adapter')
const {
	embedCachingFields,
	extractCachingFields,
} = require('./caching-fields')

// https://github.com/public-transport/hafas-client/blob/547dd4b2a954650d98d5b25d97f1d822e47c9496/index.js#L775-L791
const methods = [
	'departures', 'arrivals',
	'journeys',
	'refreshJourney',
	'journeysFromTrip',
	'locations',
	'stop',
	'nearby',
	'trip',
	'tripsByName',
	'radar',
	'reachableFrom',
	'remarks',
	'lines',
	'serverInfo',
]

const embedOptCachingFields = (msg, params) => {
	const opt = params[params.length - 1]
	if ('object' !== typeof opt || opt === null) return msg
	return embedCachingFields(msg, opt)
}

const errorsInARow = Symbol('errorsInARow')

const inspect = (_, opt) => opt.stylize('[hafas-client-rpc]', 'special')

const createClientAdapter = (send, maxErrorsInArow = 3) => {
	const handlers = Object.create(null) // by msg ID
	let i = 0

	// todo: cache this thing
	const getProp = (target, prop) => {
		if (prop === customInspect) return inspect
		if (methods.includes(prop)) {
			return (...params) => {
				const id = ++i + ''
				const msg = embedOptCachingFields(
					request(id, prop, params).serialize(),
					params,
				)

				return new Promise((resolve, reject) => {
					handlers[id] = [resolve, reject]
					debug('sending', msg)
					send(msg) // todo: handle rejections
				})
			}
		}
		return 'string' === typeof prop ? target[prop] : undefined
	}

	const setProp = (target, prop, val) => {
		target[prop] = val
		return val
	}

	const onMessage = (msg, connection) => {
		const res = parse(msg)
		if (!res || !res.payload) return;
		const handler = handlers[res.payload.id]
		if (!handler) return;
		debug('received', msg)

		if ('error' in res.payload) {
			const err = res.payload.error
			const data = err.data
			delete err.data
			Object.assign(err, data)
			handler[1](err)

			if (!err.isHafasError) {
				connection[errorsInARow]++
				debug(connection.url, connection[errorsInARow], 'non-HAFAS errors in a row')
				if (connection[errorsInARow] > maxErrorsInArow) connection.close()
			}
		} else if ('result' in res.payload) {
			connection[errorsInARow] = 0
			const result = extractCachingFields(msg, res.payload.result)
			handler[0](result)
		}
	}

	const onConnection = (connection) => {
		connection[errorsInARow] = 0
	}

	return {
		facade: new Proxy({}, {get: getProp, set: setProp}),
		onMessage,
		onConnection
	}
}

module.exports = createClientAdapter
