'use strict'

const createClient = require('../stdio/client')

const client = createClient((_, hafas) => {
	hafas.departures('900009102')
	.then((res) => {
		console.log(res)

		client.close()
	})
	.catch((err) => {
		console.error(err)
		process.exit(1)
	})
})
