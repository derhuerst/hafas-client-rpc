import {createClient as createHafas} from 'hafas-client'
import {profile as vbbProfile} from 'hafas-client/p/vbb/index.js'

import exposeHafasClient from '../nats-streaming/server.js'
import createClient from '../nats-streaming/client.js'

const onError = (err) => {
	if (!err) return;
	console.error(err)
	process.exit(1)
}

// server

const hafas = createHafas(vbbProfile, 'hafas-client-rpc WebSockets example')
// eslint-disable-next-line no-unused-vars
const server = exposeHafasClient(hafas, onError)
server.on('error', onError)

// client

const client = createClient((err, hafas) => {
	if (err) onError(err)

	hafas.departures('900009102')
	.then((res) => {
		console.log(res)

		client.close()
		server.close()
	})
	.catch(onError)
})
client.on('error', onError)
