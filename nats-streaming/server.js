'use strict'

const {promisify} = require('util')
const {name: pkgName} = require('../package.json')
const connectToNatsStreaming = require('./connect')
const createServerAdapter = require('../lib/server-adapter')

const exposeHafasClientViaNatsStreaming = (hafas, opt, cb) => {
	if ('function' === typeof opt) {
		cb = opt
		opt = {}
	}
	const {
		channel,
		queueGroup,
	} = {
		channel: process.env.NATS_CHANNEL || pkgName,
		queueGroup: Math.random().toString(16).slice(2),
		...opt,
	}

	const onMessage = createServerAdapter(hafas)

	const nats = connectToNatsStreaming()

	const pPublish = promisify(nats.publish.bind(nats))
	const respond = (msg) => {
		return pPublish(channel + '-res', Buffer.from(msg, 'utf8'))
	}

	nats.on('error', cb)
	nats.once('connect', () => {
		nats.removeListener('error', cb)

		const opts = nats
		.subscriptionOptions()
		.setDeliverAllAvailable()
		.setDurableName(queueGroup)
		const subscription = nats.subscribe(channel + '-req', queueGroup, opts)
		subscription.on('message', (msg) => {
			const data = msg.getData().toString('utf8')
			onMessage(data, respond)
		})

		subscription.once('ready', () => {
			cb(null)
		})
	})

	return nats
}

module.exports = exposeHafasClientViaNatsStreaming
