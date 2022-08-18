const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

const dist = path.resolve(__dirname, "dist");

module.exports = {
  mode: "production",
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    fallback: {
      path: false,
      fs: false,
    },
  },
  module: {
    rules: [
      {
        test: /\.(eot|ttf|woff|woff2|svg|png|gif|jpe?g)$/,
        use: [{ loader: "file-loader" }],
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.m?[jt]sx?$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/preset-env",
              "@babel/preset-react",
              "@babel/preset-typescript",
            ],
            plugins: [
              "@babel/plugin-proposal-class-properties",
              [
                "@babel/plugin-transform-runtime",
                {
                  regenerator: true,
                },
              ],
            ],
          },
        },
      },
    ],
  },
  entry: {
    index: "./src/index.tsx",
  },
  output: {
    path: dist,
    filename: "[name].js",
  },
  devServer: {
    static: dist,
  },
  plugins: [
    new CopyPlugin({ patterns: [path.resolve(__dirname, "static")] }),
  ].filter((a) => !!a),
};
