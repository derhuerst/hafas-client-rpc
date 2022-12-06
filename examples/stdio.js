'use strict'

const createClient = require('../stdio/client')

createClient((_, hafas) => {
	hafas.departures('900009102')
	.then(console.log)
	.catch(console.error)
})
