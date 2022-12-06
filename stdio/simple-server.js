const pHafasClient = import('hafas-client')
const pVbbProfile = import('hafas-client/p/vbb/index.js')
const exposeHafasClientViaStdio = require('./server')

Promise.all([
	pHafasClient,
	pVbbProfile,
])
.then(([_hafasClient, _vbbProfile]) => {
	const {createClient: createHafas} = _hafasClient
	const {profile: vbbProfile} = _vbbProfile

	const hafas = createHafas(vbbProfile, 'hafas-client-rpc stdio example')

	exposeHafasClientViaStdio(hafas)
})
.catch((err) => {
	console.error(err)
	process.exit(1)
})
