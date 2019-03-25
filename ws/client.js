'use strict'

const createPool = require('websocket-pool')
const WebSocket = require('isomorphic-ws')
const createClientAdapter = require('../lib/client-adapter')

const maxErrorsInArow = 3

const noConnectionAvailable = createPool.noConnectionAvailable.code

const createWebSocketsRpcClient = (createScheduler, urls, cb) => {
	if (!Array.isArray(urls)) throw new Error('urls must be an array')

	const pool = createPool(WebSocket, createScheduler, {
		retry: {
			forever: true,
			factor: 1.5,
			minTimeout: 10 * 1000,
			maxTimeout: 10 * 60 * 1000
		}
	})

	const send = (msg) => {
		try {
			return pool.send(msg)
		} catch (err) {
			if (err && err.code === noConnectionAvailable) err.statusCode = 503
			throw err
		}
	}
	const {facade, onMessage, onConnection} = createClientAdapter(send, maxErrorsInArow)

	pool.on('connection-open', onConnection)
	pool.on('message', (msg, connection) => {
		onMessage(msg.data, connection)
	})

	for (let url of urls) pool.add(url)
	pool.once('open', () => cb(null, facade))
	return pool
}

module.exports = createWebSocketsRpcClient
