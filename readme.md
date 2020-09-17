# hafas-client-rpc

**Make [JSON-RPC](https://www.jsonrpc.org/) calls to [`hafas-client`](https://github.com/public-transport/hafas-client)** via

- [WebSockets](https://en.wikipedia.org/wiki/WebSocket) – Supports reconnecting and load-balancing via [`websocket-pool`](https://github.com/derhuerst/websocket-pool#websocket-pool).
- [`stdin`/`stdout`](https://en.wikipedia.org/wiki/Standard_streams)

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

`hafas-client-rpc` has multiple transports. Each of them has a client part (which sends commands to make HAFAS calls) and a server (which executes the HAFAS calls).

### via [WebSockets](https://en.wikipedia.org/wiki/WebSocket) transport

With this transport, the server part is an actual WebSockets server, and the client connects to it.

```js
// server.js
const http = require('http')
const createHafas = require('hafas-client')
const vbbProfile = require('hafas-client/p/vbb')
const exposeHafasClient = require('hafas-client-rpc/ws/server')

const httpServer = http.createServer()
httpServer.listen(3000)

const hafas = createHafas(vbbProfile, 'my-awesome-program')
const server = exposeHafasClient(httpServer, hafas)
```

```js
// client.js
const createRoundRobin = require('@derhuerst/round-robin-scheduler')
const createClient = require('hafas-client-rpc/ws/client')

const pool = createClient(createRoundRobin, [
	'ws://server-address:3000'
	// pass more addresses here if you want
], (_, hafas) => {
	hafas.departures('900000009102')
	.then(console.log)
	.catch(console.error)
})
pool.on('error', console.error)
```

### via [`stdin`/`stdout`](https://en.wikipedia.org/wiki/Standard_streams) transport

With this transport, the client spawns the server as a sub-process and sends commands via stdio.

```js
// server.js
const createHafas = require('hafas-client')
const vbbProfile = require('hafas-client/p/vbb')
const exposeViaStdio = require('hafas-client-rpc/stdio/server')

const hafas = createHafas(vbbProfile, 'my-awesome-program')

exposeViaStdio(hafas)
```

Creating a client *in Node.js* doesn't make sense, because you could just use `hafas-client` directly. You would usually write the client in another language. For demonstration purposes, a Node client:

```js
// client.js
const createClient = require('hafas-client-rpc/stdio/client')

createClient('path/to/stdio/server.js', (_, hafas) => {
	hafas.departures('900000009102')
	.then(console.log)
	.catch(console.error)
})
```

#### with other languages

Spawn the stdio RPC server as a sub process of your script:

```shell
node node_modules/hafas-client-rpc/stdio/simple-server.js
```

Send [JSON-RPC](todo) 2.0 calls via `stdin`:

```json
{"jsonrpc":"2.0","id":"1","method":"departures","params":["900000009102"]}
```

On success, you will receive the result via `stdout`:

```json
{"jsonrpc":"2.0","id":"1","result":[{"tripId":"1|32623|3|86|8122018", …}]}
```

If an error occurs, you will receive it via `stderr`:

```json
{"jsonrpc":"2.0","id":"1","error":{"message":"station ID must be a valid IBNR.","code":0,"data":{}}}
```


## Related

- [`hafas-client`](https://github.com/public-transport/hafas-client) – JavaScript client for HAFAS public transport APIs.


## Contributing

If you have a question or have difficulties using `hafas-client-rpc`, please double-check your code and setup first. If you think you have found a bug or want to propose a feature, refer to [the issues page](https://github.com/derhuerst/hafas-client-rpc/issues).
