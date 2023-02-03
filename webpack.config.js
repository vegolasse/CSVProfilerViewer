const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    devtool: 'source-map',
    entry: './src/index.ts',
    plugins: [
        new CopyPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, "html", "**/*"),
                    context: path.resolve(__dirname, "html"),
                }

            ],
        })
    ],
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        fallback: {
            "path": require.resolve("path-browserify"),
            "fs":false
        }
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    devServer: {
        static: path.join(__dirname, "dist"),
        compress: true,
        port: 4000,
        hot: true,
        devMiddleware: {
            writeToDisk: true
        }
    },
};