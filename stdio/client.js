'use strict'

const execa = require('execa')
const createClientAdapter = require('../lib/client-adapter')

const maxErrorsInArow = 10

const [$0] = process.argv
const _serverPath = require.resolve('./simple-server.js')

const ready = /^ready\n/

const createStdioRpcClient = (serverPath = _serverPath, cb) => {
	if ('function' === typeof serverPath) {
		cb = serverPath
		serverPath = _serverPath
	}

	const server = execa($0, [serverPath])
	const send = msg => {
		server.stdin.write(msg + '\n')
	}
	const close = () => {
		server.kill()
	}

	const {facade, onMessage, onConnection} = createClientAdapter(send, maxErrorsInArow)

	server.stdout.on('data', (msg) => {
		onMessage(msg.toString('utf8'), server)
	})
	server.stderr.on('data', (msg) => {
		msg = msg.toString('utf8')
		if (ready.test(msg)) {
			onConnection(server)
			cb(null, facade)
			return;
		}
		onMessage(msg, server)
	})

	return {close}
}

module.exports = createStdioRpcClient
