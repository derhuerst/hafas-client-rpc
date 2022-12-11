# hafas-client-rpc

**Make [JSON-RPC](https://www.jsonrpc.org/) calls to [`hafas-client`](https://github.com/public-transport/hafas-client)** via

- [WebSockets](https://en.wikipedia.org/wiki/WebSocket) – Supports reconnecting and load-balancing via [`websocket-pool`](https://github.com/derhuerst/websocket-pool#websocket-pool).
- [`stdin`/`stdout`](https://en.wikipedia.org/wiki/Standard_streams)
- [UNIX domain sockets](https://en.wikipedia.org/wiki/Unix_domain_socket)
- [NATS Streaming](https://docs.nats.io/nats-streaming-concepts/intro)

[![npm version](https://img.shields.io/npm/v/hafas-client-rpc.svg)](https://www.npmjs.com/package/hafas-client-rpc)
[![build status](https://api.travis-ci.org/derhuerst/hafas-client-rpc.svg?branch=master)](https://travis-ci.org/derhuerst/hafas-client-rpc)
![ISC-licensed](https://img.shields.io/github/license/derhuerst/hafas-client-rpc.svg)
[![support me via GitHub Sponsors](https://img.shields.io/badge/support%20me-donate-fa7664.svg)](https://github.com/sponsors/derhuerst)
[![chat with me on Twitter](https://img.shields.io/badge/chat%20with%20me-on%20Twitter-1da1f2.svg)](https://twitter.com/derhuerst)


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

Or using the [`websocat` command-line WebSocket client](https://github.com/vi/websocat):

```shell
echo 'departures 900000009102' | websocat --jsonrpc 'ws://server-address:3000'
```

### via [`stdin`/`stdout`](https://en.wikipedia.org/wiki/Standard_streams) transport

With this transport, the client spawns the server as a sub-process and sends commands via stdio.

```js
// server.js
const createHafas = require('hafas-client')
const vbbProfile = require('hafas-client/p/vbb')
const exposeViaStdio = require('hafas-client-rpc/stdio/server')

const hafas = createHafas(vbbProfile, 'my-awesome-program')

exposeViaStdio(hafas, (err) => {
	console.log('hafas-client-rpc server ready')
})
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

```bash
node $(node -p 'require.resolve("hafas-client-rpc/stdio/simple-server.js")')
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

### via [UNIX domain sockets](https://en.wikipedia.org/wiki/Unix_domain_socket)

With this transport, both client & server connect to a local TCP socket `/tmp/hafas-client-rpc-{version}`.

```js
// server.js
const createHafas = require('hafas-client')
const vbbProfile = require('hafas-client/p/vbb')
const exposeViaSocket = require('hafas-client-rpc/socket/server')

const hafas = createHafas(vbbProfile, 'my-awesome-program')

exposeViaSocket(hafas)
```

```js
// client.js
const createClient = require('hafas-client-rpc/socket/client')

createClient((_, hafas) => {
	hafas.departures('900000009102')
	.then(console.log)
	.catch(console.error)
})
```

### via [NATS Streaming](https://docs.nats.io/nats-streaming-concepts/intro) transport

This transport relies on [NATS streaming channels](https://docs.nats.io/nats-streaming-concepts/channels). This allows you to have a pool of servers where an individual server can go offline at any time, as the channel will persist all RPC requests until they're taken care of. The transport uses two [durable channels](https://docs.nats.io/nats-streaming-concepts/channels/subscriptions/durable) (one for RPC requests, the other for responses).

```js
// server.js
const createHafas = require('hafas-client')
const vbbProfile = require('hafas-client/p/vbb')
const exposeViaNatsStreaming = require('hafas-client-rpc/nats-streaming/server')

const hafas = createHafas(vbbProfile, 'hafas-client-rpc WebSockets example')
exposeViaNatsStreaming(hafas, (err) => {
	if (err) console.error(err)
})
```

```js
// client.js
const createClient = require('hafas-client-rpc/nats-streaming/client')

const pool = createClient((_, hafas) => {
	hafas.departures('900000009102')
	.then(console.log)
	.catch(console.error)
})
```

### Caveats

- `hafas-client` exposes the used [*profile*](https://github.com/public-transport/hafas-client/tree/95af0a012767827347fbb8b0c36053cb767cf192/p) as `hafasClient.profile`, but because *profiles* consist of JavaScript functions, which can't be serialized properley, the `hafas-client-rpc` facade *does not* expose `.profile`.


## Related

- [`hafas-client`](https://github.com/public-transport/hafas-client) – JavaScript client for HAFAS public transport APIs.


## Contributing

If you have a question or have difficulties using `hafas-client-rpc`, please double-check your code and setup first. If you think you have found a bug or want to propose a feature, refer to [the issues page](https://github.com/derhuerst/hafas-client-rpc/issues).
