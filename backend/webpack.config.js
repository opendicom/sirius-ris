const path = require('path');

module.exports = {
    mode    : 'production', // development
    entry	: './index.js',
	output	: {
	    filename    : 'index.js',
		path        : path.resolve(__dirname, 'dist')
	},
	resolve	: {
		fallback : {
			"querystring": false,
			"canvas": false,
			"tls": false,
			"net": false,
			"dns": false,
			"child_process": false,
		
			fs		: require.resolve('browserify-fs'),
			http	: require.resolve("stream-http"),
			https	: require.resolve("https-browserify"),
			os		: require.resolve("os-browserify/browser"),
			crypto	: require.resolve("crypto-browserify"),
			stream	: require.resolve("stream-browserify"),
			zlib	: require.resolve("browserify-zlib"),
			vm		: require.resolve("vm-browserify"),
		}
	},
	externals: {
		"argon2": "argon2"
	} 
}