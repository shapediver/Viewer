/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const fs = require('fs');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = merge(common, {
  mode: 'production',
  devtool: 'source-map',
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin({
      terserOptions: {
        compress: {
          unused: true,
          dead_code: true,
          passes: 3
        },
        mangle: true,
        output: {
          comments: false,
        },
        safari10: true,
        toplevel: true
      },
      extractComments: false
    })],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          onlyCompileBundledFiles: true
        }
      }
    ]
  },
  plugins: [
    new webpack.BannerPlugin(fs.readFileSync('../../LICENSE', 'utf8')),
  //   new BundleAnalyzerPlugin({
  //     analyzerMode: 'static',  // Generates report as a static HTML file
  //     reportFilename: 'report.html', // Output report file
  //     generateStatsFile: true, // Generate stats.json file
  //     statsFilename: 'stats.json', // Output stats file
  //     openAnalyzer: false, // Prevent opening in browser
  //     // Textual report
  //     analyzerPort: 8888, // Port for the analyzer
  //     defaultSizes: 'parsed',
  //     statsOptions: { source: false }, // Hide source content
  // })
  ]
});