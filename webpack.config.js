module.exports = {
  "entry": "./src/main.js",
  "output": {
    "path": __dirname,
    "filename": "bin/bundle.js"
  },
  "module": {
    rules: [
      {
        "test": /\.glsl$/,
        "loader": "webpack-glsl-loader"
      }
    ]
  }
};