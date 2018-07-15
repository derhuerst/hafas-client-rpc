'use strict'

const createPool = require('websocket-pool')
const WebSocket = require('ws')
const {parse, request} = require('jsonrpc-lite')
const customInspect = require('util').inspect.custom
const debug = require('debug')('hafas-client-rpc:client')

const noConnectionAvailable = createPool.noConnectionAvailable.code

// https://github.com/public-transport/hafas-client/blob/31973431ff1a0289e58fb8f4ab308bb1d36a0b92/index.js#L415-L419
const methods = [
	'departures', 'arrivals',
	'journeys',
	'locations',
	'station',
	'nearby',
	'journeyLeg',
	'radar'
]

const errorsInARow = Symbol('errorsInARow')
const maxErrorsInArow = 3

const createClient = (createScheduler, urls, cb) => {
	if (!Array.isArray(urls)) throw new Error('urls must be an array')

	const pool = createPool(WebSocket, createScheduler, {
		retry: {
			forever: true,
			factor: 1.5,
			minTimeout: 10 * 1000,
			maxTimeout: 10 * 60 * 1000
		}
	})

	const handlers = Object.create(null) // by msg ID

	pool.on('connection-open', (ws) => {
		ws[errorsInARow] = 0
	})

	const onMessage = (msg, ws) => {
		const res = parse(msg.data)
		if (!res || !res.payload) return;
		const handler = handlers[res.payload.id]
		if (!handler) return;

		if ('error' in res.payload) {
			const err = res.payload.error
			const data = err.data
			delete err.data
			Object.assign(err, data)
			handler[1](err)

			if (!err.isHafasError) {
				ws[errorsInARow]++
				debug(ws.url, ws[errorsInARow], 'non-HAFAS errors in a row')
				if (ws[errorsInARow] > maxErrorsInArow) ws.close()
			}
		} else if ('result' in res.payload) {
			ws[errorsInARow] = 0
			handler[0](res.payload.result)
		}
	}
	pool.on('message', onMessage)

	let i = 0
	const call = (method, params) => {
		const id = ++i
		const msg = request(id, method, params)
		return new Promise((resolve, reject) => {
			handlers[id] = [resolve, reject]
			try {
				pool.send(msg + '')
			} catch (err) {
				if (err && err.code === noConnectionAvailable) err.statusCode = 503
				throw err
			}
		})
	}

	const inspect = (_, opt) => opt.stylize('[hafas-client-rpc]', 'special')
	const getProp = (target, prop) => {
		if (prop === customInspect) return inspect
		if (methods.includes(prop)) {
			return (...params) => call(prop, params)
		}
		return 'string' === typeof prop ? target[prop] : undefined
	}
	const setProp = (target, prop, val) => {
		target[prop] = val
		return val
	}
	const facade = new Proxy({}, {get: getProp, set: setProp})

	for (let url of urls) pool.add(url)
	pool.once('open', () => cb(null, facade))
	return pool
}

module.exports = createClient
