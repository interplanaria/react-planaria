module.exports = {
  entry: ['@babel/polyfill', `${__dirname}/index.js`],
  output: {
    filename: 'dist.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: [/(node_modules)/],
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
            plugins: [
              '@babel/plugin-proposal-object-rest-spread',
              '@babel/plugin-transform-regenerator'
            ]
          }
        }
      }
    ]
  }
}