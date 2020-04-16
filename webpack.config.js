'use strict';
const path = require('path');
const nodeExternals = require('webpack-node-externals');

const BUILD = path.resolve(__dirname, 'build');
const DIST = path.resolve(__dirname, 'dist');

module.exports = {
	entry: path.join(BUILD, 'index.js'),
	mode: 'production',
	target: 'node',
	externals: [nodeExternals()],
	output: {
		filename: 'app.bundle.js',
		path: DIST
	}
}
