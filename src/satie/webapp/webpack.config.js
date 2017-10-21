var webpack = require("webpack");
var path = require("path");
var cssnext = require("postcss-cssnext");
var cssimport = require("postcss-import");

var port = 4200;
var host = "localhost";

module.exports = {
    entry: [
        `webpack-dev-server/client?http://${host}:${port}`,
        "webpack/hot/dev-server",
        "./dist/webapp/src/index.js"
    ],
    output: {
        path: __dirname + "/dist/satie",
        filename: "dist.js",
        publicPath: "/"
    },
    externals: {
        "react": "React",
        "react-dom": "ReactDOM",
        "react-dom/server": "ReactDOMServer",
        "lodash": "_"
    },
    resolve: {
        modulesDirectories: [
            "node_modules",
            "./webapp/node_modules",
        ]
    },
    resolveLoader: {
        modulesDirectories: [
            "node_modules",
            "./webapp/node_modules",
        ]
    },
    module: {
        preLoaders: [
            {
                test: /dist\/.*\.js$/,
                loader: "source-map-loader"
            }
        ],
        loaders: [
            {
                test: /dist\/.*\.js$/,
                loaders: [
                    "react-hot"
                ]
            },
            {
                test: /\.css$/,
                loaders: [
                    "style-loader",
                    "css-loader?modules",
                    "postcss-loader"
                ]
            }
        ]
    },
    postcss: [
        cssimport({
        }),
        cssnext({
        }),
    ],
    node: {
        fs: "empty"
    },
    plugins: [
        new webpack.DefinePlugin({
            "process.env": {
                NODE_ENV: '"dev"',
            }
        })
    ]
}
