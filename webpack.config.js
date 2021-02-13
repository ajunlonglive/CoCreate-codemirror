const path = require('path')

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: {
    'CoCreate-codemirror': './src/codemirror_class.js',
    // 'codemirror.bundle': './src/codemirror.js',
  },
  output: {
    globalObject: 'self',
    path: path.resolve(__dirname, './dist/'),
    //filename: 'CoCreate-codemirror.js',
    filename: '[name].js',
    publicPath: '/codemirror/dist/'
  },
  devServer: {
    contentBase: path.join(__dirname),
    compress: true,
    publicPath: '/dist/'
  }
}
