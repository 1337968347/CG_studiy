const CopyPlugin = require("copy-webpack-plugin");
const path = require("path");

module.exports = {
  mode: "development",
  entry: "./src/index.ts",
  devServer: {
    static: {
      directory: path.join(__dirname, "dist"),
    },
    compress: false,
    port: 9000,
  },
  module: {
    rules: [
      {
        loader: "babel-loader",
        test: /\.js$|jsx/,
        exclude: /node_modules/,
      },
      {
        loader: "ts-loader",
        test: /\.ts/,
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "./src/shader", to: "shader", noErrorOnMissing: true },
        { from: "./src/assets", to: "assets", noErrorOnMissing: true },
      ],
    }),
  ],
  resolve: {
    extensions: [".ts", ".js"],
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "main.bundle.js",
  },
};
