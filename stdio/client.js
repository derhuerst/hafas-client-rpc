'use strict'

const execa = require('execa')
const {pipeline, Writable} = require('stream')
const LinesStream = require('stream-lines')
const createClientAdapter = require('../lib/client-adapter')

const maxErrorsInArow = 10

const [$0] = process.argv
const _serverPath = require.resolve('./simple-server.js')

const ready = /^ready$/

const createStdioRpcClient = (serverPath = _serverPath, cb) => {
	if ('function' === typeof serverPath) {
		cb = serverPath
		serverPath = _serverPath
	}

	const server = execa($0, [serverPath])
	let isReady = false

	const send = msg => {
		server.stdin.write(msg + '\n')
	}
	const close = () => {
		server.kill()
	}

	const {facade, onMessage, onConnection} = createClientAdapter(send, maxErrorsInArow)

	const readLines = (input, onLines) => {
		pipeline(
			input,
			new LinesStream(),
			new Writable({
				objectMode: true,
				write: onLines,
			}),
			(err) => {
				if (!err) return;
				// todo: where/how to emit/report this error properly?
				console.error('hafas-client-rpc stdio client:', err)
			},
		)
	}

	readLines(server.stdout, (msgs, _, _cb) => {
		for (const msg of msgs) {
			onMessage(msg, server)
		}
		_cb()
	})
	readLines(server.stderr, (msgs, _, _cb) => {
		for (const msg of msgs) {
			if (!isReady && ready.test(msg)) {
				isReady = true
				onConnection(server)
				cb(null, facade)
				continue;
			}
			onMessage(msg, server)
		}
		_cb()
	})

	return {close}
}

module.exports = createStdioRpcClient
