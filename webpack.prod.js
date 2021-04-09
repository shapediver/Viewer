const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const fs = require("fs");
const webpack = require("webpack");

module.exports = merge(common, {
  mode: 'production',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        options: {
          onlyCompileBundledFiles: true
        }
      }
    ]
  },
  plugins: [
    new webpack.BannerPlugin(fs.readFileSync('../../LICENSE', 'utf8')),
  ]
});