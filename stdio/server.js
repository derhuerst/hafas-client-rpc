'use strict'

const {Server} = require('ws')
const createServerAdapter = require('../lib/server-adapter')
const pump = require('pump')
const {Transform} = require('stream')
const LinesStream = require('stream-lines')

const defaults = {
	stdin: process.stdin,
	stdout: process.stdout,
	stderr: process.stderr,
	bufferSize: 32
}

const exposeHafasClientViaStdio = (hafas, opt = {}) => {
	const onMessage = createServerAdapter(hafas)
	const transform = ([msg], _, cb) => { // todo: loop over the array?
		const respond = msg => {
			cb(null, msg + '\n')
		}
		try {
			onMessage(msg, respond)
		} catch (err) {
			cb(err)
		}
	}

	const {stdin, stdout, stderr, bufferSize} = Object.assign({}, defaults, opt)
	pump(
		stdin,
		new LinesStream(),
		new Transform({
			objectMode: true,
			highWaterMark: bufferSize,
			transform
		}),
		stdout,
		(err) => {
			// todo: does this work?
			if (err) stderr.write(JSON.stringify(err + ''))
		}
	)

	setImmediate(() => {
		stderr.write('ready\n')
	})
}

module.exports = exposeHafasClientViaStdio
