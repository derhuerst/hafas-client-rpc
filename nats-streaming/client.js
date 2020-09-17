'use strict'

const {promisify} = require('util')
const {name: pkgName} = require('../package.json')
const connectToNatsStreaming = require('./connect')
const createClientAdapter = require('../lib/client-adapter')

const createNatsStreamingRpcHafasClient = (opt, cb) => {
	if ('function' === typeof opt) {
		cb = opt
		opt = {}
	}
	const {
		queueGroup,
		channel,
	} = {
		channel: process.env.NATS_CHANNEL || pkgName,
		queueGroup: Math.random().toString(16).slice(2),
		...opt,
	}

	const nats = connectToNatsStreaming()

	const pPublish = promisify(nats.publish.bind(nats))
	const request = (msg) => {
		return pPublish(channel + '-req', Buffer.from(msg, 'utf8'))
	}
	const {facade, onMessage, onConnection} = createClientAdapter(request)

	nats.on('error', cb)
	nats.once('connect', () => {
		nats.removeListener('error', cb)

		const opts = nats.subscriptionOptions().setDurableName(queueGroup)
		const subscription = nats.subscribe(channel + '-res', queueGroup, opts)
		subscription.on('message', (msg) => {
			const data = msg.getData().toString('utf8')
			onMessage(data, subscription)
		})

		subscription.once('ready', () => {
			onConnection(subscription)
			cb(null, facade)
		})
	})

	return nats
}

module.exports = createNatsStreamingRpcHafasClient
