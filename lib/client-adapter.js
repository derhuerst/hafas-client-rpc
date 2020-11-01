'use strict'

const {parse, request} = require('jsonrpc-lite')
const customInspect = require('util').inspect.custom
const debug = require('debug')('hafas-client-rpc:client-adapter')

// https://github.com/public-transport/hafas-client/blob/31973431ff1a0289e58fb8f4ab308bb1d36a0b92/index.js#L415-L419
const methods = [
	'departures', 'arrivals',
	'journeys',
	'refreshJourney',
	'locations',
	'station', // `hafas-client@3`
	'stop',
	'nearby',
	'journeyLeg', // `hafas-client@2`
	'trip',
	'radar',
	'reachableFrom'
]

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
				const msg = request(id, prop, params).serialize()
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
			handler[0](res.payload.result)
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
