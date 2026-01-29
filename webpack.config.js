const path = require("path");
const WebpackObfuscator = require('webpack-obfuscator');

module.exports = {
  plugins: [
    new WebpackObfuscator({
      rotateStringArray: true
    }),
  ],
  entry: path.resolve(__dirname, "src/index.js"),
  output: {
    path: path.resolve(__dirname),
    filename: "index.js",
    library: "CommonEncryption",
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