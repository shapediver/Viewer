const { merge } = require('webpack-merge');
const common = require('../../webpack.common.js');
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
  ],
  output: {
    libraryTarget: 'commonjs2'
  },
  externals: {
    "@shapediver/viewer": "@shapediver/viewer", 
    "@shapediver/viewer.rendering-engine.intersection-engine": "@shapediver/viewer.rendering-engine.intersection-engine", 
    "@shapediver/viewer.shared.math": "@shapediver/viewer.shared.math", 
    "@shapediver/viewer.shared.node-tree": "@shapediver/viewer.shared.node-tree", 
    "@shapediver/viewer.shared.services": "@shapediver/viewer.shared.services", 
    "@shapediver/viewer.shared.types": "@shapediver/viewer.shared.types", 
  }
});