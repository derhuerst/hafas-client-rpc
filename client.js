'use strict'

const ReconnectingWebSocket = require('reconnecting-websocket')
const WebSocket = require('ws')
const {parse, request} = require('jsonrpc-lite')

const createClient = (url, onError, onceOpen) => {
	const ws = new ReconnectingWebSocket(url, [], {WebSocket})
	ws.addEventListener('error', onError)

	const handlers = Object.create(null) // by msg ID

	const onMessage = (msg) => {
		const res = parse(msg.data)
		if (!res || !res.payload) return;
		const handler = handlers[res.payload.id]
		if (!handler) return;
		if ('error' in res.payload) handler[1](res.payload.error)
		else if ('result' in res.payload) handler[0](res.payload.result)
	}
	ws.addEventListener('message', onMessage)

	let i = 0
	const call = (method, params) => {
		const id = ++i
		const msg = request(id, method, params)
		return new Promise((resolve, reject) => {
			handlers[id] = [resolve, reject]
			ws.send(msg + '')
		})
	}

	const get = (_, prop) => (...params) => call(prop, params)
	const facade = new Proxy(Object.create(null), {get})

	const onOpen = () => {
		ws.removeEventListener('open', onOpen)
		onceOpen(facade)
	}
	ws.addEventListener('open', onOpen)

	return ws
}

module.exports = createClient
