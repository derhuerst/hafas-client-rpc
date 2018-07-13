# hafas-client-rpc

**Make [JSON-RPC](https://www.jsonrpc.org/) calls to [`hafas-client`](https://github.com/public-transport/hafas-client) via [WebSockets](https://en.wikipedia.org/wiki/WebSocket).**

[![npm version](https://img.shields.io/npm/v/hafas-client-rpc.svg)](https://www.npmjs.com/package/hafas-client-rpc)
[![build status](https://api.travis-ci.org/derhuerst/hafas-client-rpc.svg?branch=master)](https://travis-ci.org/derhuerst/hafas-client-rpc)
![ISC-licensed](https://img.shields.io/github/license/derhuerst/hafas-client-rpc.svg)
[![chat with me on Gitter](https://img.shields.io/badge/chat%20with%20me-on%20gitter-512e92.svg)](https://gitter.im/derhuerst)
[![support me on Patreon](https://img.shields.io/badge/support%20me-on%20patreon-fa7664.svg)](https://patreon.com/derhuerst)


## Installation

```shell
npm install hafas-client-rpc
```


## Usage

```js
// server.js
const http = require('http')
const createHafas = require('hafas-client')
const vbbProfile = require('hafas-client/p/vbb')
const exposeHafasClient = require('hafas-client-rpc/server')

const httpServer = http.createServer()
httpServer.listen(3000)

const hafas = createHafas(vbbProfile)
const server = exposeHafasClient(httpServer, hafas)
```

```js
// client.js
const createClient = require('hafas-client-rpc/client')

const onError = console.error

createClient('ws://server-address:3000', onError, (hafas) => {
	hafas.departures('900000009102')
	.then(console.log)
	.catch(console.error)
})
```


## Contributing

If you have a question or have difficulties using `hafas-client-rpc`, please double-check your code and setup first. If you think you have found a bug or want to propose a feature, refer to [the issues page](https://github.com/derhuerst/hafas-client-rpc/issues).
