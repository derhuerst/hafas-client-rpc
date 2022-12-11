import http from 'http'
import {createClient as createHafas} from 'hafas-client'
import {profile as vbbProfile} from 'hafas-client/p/vbb/index.js'
import createRoundRobin from '@derhuerst/round-robin-scheduler'

import exposeHafasClient from '../ws/server.js'
import createClient from '../ws/client.js'

// server

const httpServer = http.createServer()
httpServer.listen(3000)

const hafas = createHafas(vbbProfile, 'hafas-client-rpc WebSockets example')
// eslint-disable-next-line no-unused-vars
const server = exposeHafasClient(httpServer, hafas)

// client

const pool = createClient(createRoundRobin, [
	'ws://localhost:3000'
], (_, hafas) => {
	hafas.departures('900009102')
	.then((res) => {
		console.log(res)

		httpServer.close()
		pool.close()
	})
	.catch(console.error)
})
pool.on('error', console.error)
