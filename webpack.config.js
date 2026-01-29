import path from "path";
import { fileURLToPath } from "url";
import WebpackObfuscator from 'webpack-obfuscator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  plugins: [
    new WebpackObfuscator({
      rotateStringArray: true
    }),
  ],
  entry: path.resolve(__dirname, "src/index.js"),
  resolve: {
    fallback: {
      "crypto": false
    }
  },
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