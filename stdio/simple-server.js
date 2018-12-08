'use strict'

const createHafas = require('hafas-client')
const vbbProfile = require('hafas-client/p/vbb')

const exposeHafasClientViaStdio = require('./server')

const hafas = createHafas(vbbProfile, 'hafas-client-rpc stdio example')

exposeHafasClientViaStdio(hafas)
