'use strict'

const exposeHafasClientViaStdio = require('../stdio/server')

const hafas = {
	departures: () => Promise.resolve(['mock'])
}

exposeHafasClientViaStdio(hafas)
