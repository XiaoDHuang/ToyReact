const path = require('path');
module.exports = {
  mode: 'development',
  entry: {
    main: path.resolve(__dirname, './src/main.js')
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      }
    ]
  }
}