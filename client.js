'use strict'

const createPool = require('websocket-pool')
const WebSocket = require('ws')
const {parse, request} = require('jsonrpc-lite')

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
		if ('error' in res.payload) handler[1](res.payload.error)
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

	const get = (_, prop) => (...params) => call(prop, params)
	const facade = new Proxy(Object.create(null), {get})

	for (let url of urls) pool.add(url)
	pool.once('open', () => cb(null, facade))
	return pool
}

module.exports = createClient
