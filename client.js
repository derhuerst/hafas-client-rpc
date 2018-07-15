'use strict'

const createPool = require('websocket-pool')
const WebSocket = require('ws')
const {parse, request} = require('jsonrpc-lite')
const customInspect = require('util').inspect.custom

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

// todo: kill WebSocket on HAFAS errors
const createClient = (createScheduler, urls, cb) => {
	if (!Array.isArray(urls)) throw new Error('urls must be an array')

	const pool = createPool(WebSocket, createScheduler, {
		retry: {
			forever: true,
			factor: 1.5,
			minTimeout: 10000
		}
	})

	const handlers = Object.create(null) // by msg ID

	const onMessage = (msg) => {
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
		}
		else if ('result' in res.payload) handler[0](res.payload.result)
	}
	pool.on('message', onMessage)

	let i = 0
	const call = (method, params) => {
		const id = ++i
		const msg = request(id, method, params)
		return new Promise((resolve, reject) => {
			handlers[id] = [resolve, reject]
			pool.send(msg + '')
		})
	}

	const inspect = (_, opt) => opt.stylize('[hafas-client-rpc]', 'special')
	const get = (target, prop) => {
		if (prop === customInspect) return inspect
		if (!methods.includes(prop)) return undefined
		return (...params) => call(prop, params)
	}
	const facade = new Proxy({}, {get})

	for (let url of urls) pool.add(url)
	pool.once('open', () => cb(null, facade))
	return pool
}

module.exports = createClient
