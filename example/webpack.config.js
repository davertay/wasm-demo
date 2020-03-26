const path = require('path');

module.exports = {
  entry: './src/index.js',
  module: {
    rules: [
      {
        test: /\.js$/,
        type: 'javascript/auto',
        exclude: /node_modules/,
      },
      {
        test: /\.wasm$/,
        type: 'javascript/auto',
        loaders: ['arraybuffer-loader'],
      },
    ],
  },
  resolve: {
    extensions: [ '.js' ],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'demo',
    libraryTarget: 'commonjs-module',
  },
};
