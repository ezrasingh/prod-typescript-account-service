'use strict';
const path = require('path');
const nodeExternals = require('webpack-node-externals');

const SRC = path.resolve(__dirname, 'src');
const DIST = path.resolve(__dirname, 'dist');

module.exports = {
	entry: path.join(SRC, 'index.ts'),
	mode: 'production',
	target: 'node',
	externals: [nodeExternals()],
	module: {
		rules: [
			{
				test: /\.ts$/,
				loader: 'ts-loader'
			}
		]
	},
	resolve: {
		extensions: [ '.ts' ]
	},
	output: {
		filename: 'app.bundle.js',
		path: DIST
	}
}
