const { resolve } = require("path");
const { merge } = require("webpack-merge");
const BASE_CONFIG = require("./config.base");
const ExtraWatchWebpackPlugin = require("extra-watch-webpack-plugin");
const webpack = require("webpack");
require("dotenv").config();

/** @type { import('webpack').Configuration } */
const DEV_CONFIG = {
  mode: "development",
  devtool: "inline-source-map",
  devServer: {
    compress: true,
    port: 3010,
    open: true,
    hot: false,
    historyApiFallback: true,
    client: {
      overlay: false,
    },
    nodeOptions: {
      max_old_space_size: 512,
    },
  },
  plugins: [
    new ExtraWatchWebpackPlugin({
      dirs: [resolve(__dirname, "../static/html")],
    }),
    new webpack.DefinePlugin({
      BACKEND_URL: JSON.stringify(
        process.env.BACKEND_URL || "http://localhost:5005"
      ),
      IS_DEVELOPMENT: JSON.stringify(true),
    }),
  ],
};

module.exports = merge(BASE_CONFIG, DEV_CONFIG);
