import path from "path";
import { fileURLToPath } from "url";
import WebpackObfuscator from 'webpack-obfuscator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commonConfig = {
  entry: path.resolve(__dirname, "src/index.js"),
  resolve: { fallback: { "crypto": false } },
  module: {
    rules: [{
      test: /\.(js)$/,
      exclude: /node_modules/,
      enforce: 'post',
      use: {
        loader: WebpackObfuscator.loader,
        options: { rotateStringArray: true }
      }
    }]
  },
  plugins: [new WebpackObfuscator({ rotateStringArray: true })],
  mode: "production",
  devtool: false
};

export default [
  // 1. NODE.JS / COMMONJS VERSION
  {
    ...commonConfig,
    target: 'node', // <--- Add this: tells Webpack it's running in Node
    resolve: { fallback: { "crypto": false } }, // Webpack 5 still needs this, but 'target: node' helps
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "index.cjs",
      library: { type: "commonjs" },
    }
  },
  // 2. ESM VERSION (Browser/Bundler)
  {
    ...commonConfig,
    target: 'web', // <--- Add this: explicit browser target
    experiments: { outputModule: true },
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "index.js",
      library: { type: "module" },
    }
  }
];