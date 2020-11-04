'use strict'

// This module transparently encodes and decodes Symbols used by
// cached-hafas-client to control caching behavior.

// https://github.com/public-transport/cached-hafas-client/blob/a9b83077d87eaf1b1c8c969b60e1f6eaa0cf5f04/index.js#L13-L14
const CACHED = Symbol.for('cached-hafas-client:cached')
const CACHE_TIME = Symbol.for('cached-hafas-client:time')

const encodeCachingFields = (obj) => {
	let nrOfSymbols = 0
	const res = {}
	if (CACHED in obj) {
		res.cached = obj[CACHED]
		nrOfSymbols++
	}
	if (CACHE_TIME in obj) {
		res.cacheTime = obj[CACHE_TIME]
		nrOfSymbols++
	}
	return nrOfSymbols === 0 ? null : res
}

const decodeCachingFields = (encoded, obj = {}) => {
	if (!encoded) return obj

	if ('cached' in encoded) {
		Object.defineProperty(obj, CACHED, {value: encoded.cached})
	}
	if ('cacheTime' in encoded) {
		Object.defineProperty(obj, CACHE_TIME, {value: encoded.cacheTime})
	}
	return obj
}

const embedCachingFields = (msg, obj) => {
	const caching = encodeCachingFields(obj)
	if (!caching) return msg
	return (
		msg.slice(0, -1)
		+ `,"caching":${JSON.stringify(caching)}`
		+ msg.slice(-1)
	)
}

const extractCachingFields = (msg, obj = {}) => {
	msg = JSON.parse(msg)
	if (msg.caching) decodeCachingFields(msg.caching, obj)
	return obj
}

module.exports = {
	CACHED,
	CACHE_TIME,
	encodeCachingFields,
	decodeCachingFields,
	embedCachingFields,
	extractCachingFields,
}
