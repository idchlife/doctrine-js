'use strict';

const ProgressPlugin = require('bitbar-webpack-progress-plugin');

module.exports = {
  entry: {
    'doctrine': './src/doctrine.ts',
    'test-utils': './src/test-utils.ts'
  },
  output: {
    filename: './dist/[name].js'
  },
  resolve: {
    // Add `.ts` and `.tsx` as a resolvable extension.
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.tsx', '.js']
  },
  module: {
    loaders: [
      // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
      { test: /\.ts$/, loader: 'awesome-typescript-loader' }
    ]
  },
  plugins: [
    new ProgressPlugin()
  ]
};