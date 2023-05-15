const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const path = require("path");

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    open: true,
    static: path.resolve(__dirname, 'dist-dev')
  }, 
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        options: {
          transpileOnly: true,
          onlyCompileBundledFiles: true
        }
      }
    ]
  }
});