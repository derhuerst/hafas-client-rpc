'use strict'

const {createServer} = require('net')
const pump = require('pump')
const LinesStream = require('stream-lines')
const {unlink} = require('fs')
const createServerAdapter = require('../lib/server-adapter')
const SOCKET_PATH = require('./path')

const noop = () => {}

const exposeHafasClientViaSockets = (hafas, cb = noop) => {
	const onMessage = createServerAdapter(hafas)

	const server = createServer((client) => {
		const respond = (msg) => {
			client.write(msg + '\n')
		}
		const handleIncoming = (msgs) => {
			for (let i = 0, l = msgs.length; i < l; i++) {
				onMessage(msgs[i], respond)
			}
		}

		const lines = new LinesStream()
		lines.on('data', handleIncoming)
		pump(
			client,
			lines,
			(err) => {
				if (err) console.error(err) // todo: find a better sink
			},
		)
	})

	const close = () => {
		process.removeListener('beforeExit', close)
		server.close()
	}
	unlink(SOCKET_PATH, (err) => {
		if (err && err.code !== 'ENOENT') {
			cb(err)
			return;
		}

		server.listen(SOCKET_PATH, (err) => {
			if (err) {
				cb(err)
				return;
			}

			process.on('beforeExit', close)
			cb(null)
		})
	})

	return {close}
}

module.exports = exposeHafasClientViaSockets
