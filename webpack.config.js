export default {
  "mode": "production",
  "entry": "./src/main.js",
  "resolve": {
    "fallback": {
      "crypto": false
    }
  },
  "output": {
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
