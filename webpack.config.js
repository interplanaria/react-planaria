module.exports = {
  entry: [`${__dirname}/index.js`],
  output: {
    filename: 'dist.js',
    libraryTarget: 'umd',
    umdNamedDefine: true,
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
  },
  resolve: {
    alias: {
      react: `${__dirname}/node_modules/react`,
      'react-dom': `${__dirname}/node_modules/react-dom`, 
    }
  },
  externals: {
    react: {
      commonjs: "react",
      commonjs2: "react",
      amd: "React",
      root: "React",
    },
    "react-dom": {
      commonjs: "react-dom",
      commonjs2: "react-dom",
      amd: "ReactDOM",
      root: "ReactDOM",
    }  
  }
}