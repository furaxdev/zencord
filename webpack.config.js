const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

/** @author FuraxDev */
module.exports = {
  entry: {
    core: "./src/core.ts",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "manifest.json", to: "manifest.json" },
        { from: "public", to: ".", globOptions: { ignore: ["**/index.html"] } },
      ],
    }),
  ],
  devtool: "source-map",
};
