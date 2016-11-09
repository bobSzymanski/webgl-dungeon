module.exports = {
    entry: "./src/main.js",
    output: {
        path: __dirname,
        filename: "bin/bundle.js"
    },
    module: {
        loaders: [
            {
                test: /\.glsl$/,
                loader: 'webpack-glsl'
            }
        ]
    }
};