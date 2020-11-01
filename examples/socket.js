'use strict'

const createHafas = require('hafas-client')
const vbbProfile = require('hafas-client/p/vbb')

const exposeHafasClient = require('../socket/server')
const createClient = require('../socket/client')

const showError = (err) => {
	console.error(err)
	process.exit(1)
}

const hafas = createHafas(vbbProfile, 'hafas-client-rpc WebSockets example')
exposeHafasClient(hafas, (err) => {
	if (err) showError(err)

	createClient((err, hafas) => {
		if (err) showError(err)

		hafas.departures('900000009102')
		.then(console.log)
		.catch(console.error)
	})
})
