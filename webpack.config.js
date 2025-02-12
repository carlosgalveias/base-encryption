const path = require("path");
const webpack = require('webpack');
const WebpackObfuscator = require('webpack-obfuscator');

module.exports = {
  resolve: {
    fallback: {
      crypto: require.resolve("crypto-browserify"),
      buffer: require.resolve("buffer/"),
      stream: require.resolve("stream-browserify")
    }
  },
  plugins: [
    new webpack.BannerPlugin({
      banner: `try {global.crypto = require('crypto')} catch (e) {}\n`,
      raw: true, // This ensures the text is inserted as-is without comment wrapping
    }),
    new WebpackObfuscator({
      rotateStringArray: true
    }),
  ],
  entry: path.resolve(__dirname, "src/index.js"),
  output: {
    path: path.resolve(__dirname),
    filename: "index.js",
    library: "BaseEncryption",
    libraryTarget: "umd",
    globalObject: "this"
  },
  module: {
    rules: [{
      test: /\.(js)$/,
      exclude: /node_modules/,
      enforce: 'post',
      use: {
        loader: WebpackObfuscator.loader,
        options: {
          rotateStringArray: true
        }
      }
    }]
  },
  mode: "production",
  devtool: false
};