'use strict'

const {Server} = require('ws')
const createServerAdapter = require('../lib/server-adapter')

const exposeHafasClientViaWebSockets = (httpServer, hafas) => {
	const onMessage = createServerAdapter(hafas)

	const wsServer = new Server({server: httpServer})
	wsServer.on('connection', (client) => {
		const respond = msg => client.send(msg + '')
		client.on('message', (msg) => onMessage(msg + '', respond))

		client.addEventListener('ping', data => client.pong(data))
	})

	// todo: close fn?
	// websocketServer.close();
	// for (const ws of websocketServer.clients) ws.terminate()

	return wsServer
}

module.exports = exposeHafasClientViaWebSockets
