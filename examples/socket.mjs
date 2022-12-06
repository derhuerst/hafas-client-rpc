import {createClient as createHafas} from 'hafas-client'
import {profile as vbbProfile} from 'hafas-client/p/vbb/index.js'

import exposeHafasClient from '../socket/server.js'
import createClient from '../socket/client.js'

const showError = (err) => {
	console.error(err)
	process.exit(1)
}

const hafas = createHafas(vbbProfile, 'hafas-client-rpc WebSockets example')
const server = exposeHafasClient(hafas, (err) => {
	if (err) showError(err)

	const client = createClient((err, hafas) => {
		if (err) showError(err)

		hafas.departures('900009102')
		.then(console.log)
		.catch(console.error)
	})
})
