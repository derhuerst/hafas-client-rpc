'use strict'

const createHafas = require('hafas-client')
const vbbProfile = require('hafas-client/p/vbb')

const exposeHafasClient = require('../nats-streaming/server')
const createClient = require('../nats-streaming/client')

const onError = (err) => {
	if (!err) return;
	console.error(err)
	process.exit(1)
}

// server

const hafas = createHafas(vbbProfile, 'hafas-client-rpc WebSockets example')
// eslint-disable-next-line no-unused-vars
const server = exposeHafasClient(hafas, onError)

// client

const client = createClient((err, hafas) => {
	if (err) onError(err)

	hafas.departures('900000009102')
	.then(console.log)
	.catch(console.error)
})
client.on('error', onError)
