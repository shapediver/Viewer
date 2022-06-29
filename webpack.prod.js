const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const fs = require("fs");
const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = merge(common, {
  mode: 'production',
  devtool: 'source-map',
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin({
      terserOptions: {
        safari10: true
      }
    })],
  },
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