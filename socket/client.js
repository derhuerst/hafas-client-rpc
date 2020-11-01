'use strict'

const {connect} = require('net')
const pump = require('pump')
const LinesStream = require('stream-lines')
const SOCKET_PATH = require('./path')
const createClientAdapter = require('../lib/client-adapter')

const maxErrorsInArow = 3

const createSocketsRpcClient = (cb) => {
	const server = connect(SOCKET_PATH, (err) => {
		if (err) {
			cb(err)
			return;
		}
		onConnection(server)
		cb(null, facade)
	})

	const send = (msg) => {
		server.write(msg + '\n')
	}
	const close = () => {
		server.destroy()
	}

	const {facade, onMessage, onConnection} = createClientAdapter(send, maxErrorsInArow)
	const handleIncoming = (msgs) => {
		for (let i = 0, l = msgs.length; i < l; i++) {
			onMessage(msgs[i], server)
		}
	}

	const lines = new LinesStream()
	lines.on('data', handleIncoming)
	pump(
		server,
		lines,
		(err) => {
			if (err && err.message !== 'premature close') { // 🤔
				console.error(err) // todo: find a better sink
			}
		},
	)

	return {close}
}

module.exports = createSocketsRpcClient
