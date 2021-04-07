import nodeResolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'

const debugResolve = {
  resolveId (importee) {
    if (importee === 'y-codemirror') {
      return `${process.cwd()}/src/index.js`
    }
    if (importee === 'yjs') {
      return `${process.cwd()}/node_modules/yjs/src/index.js`
    }
    return null
  }
}

export default [{
  input: './src/js/y-codemirror.js',
  external: id => /^(lib0|yjs|y-protocols|simple-peer)/.test(id),
  output: [{
    name: 'y-codemirror',
    file: 'dist/y-codemirror.cjs',
    format: 'cjs',
    sourcemap: true,
    paths: path => {
      if (/^lib0\//.test(path)) {
        return `lib0/dist${path.slice(4, -3)}.cjs`
      } else if (/^y-protocols\//.test(path)) {
        return `y-protocols/dist${path.slice(11, -3)}.cjs`
      }
      return path
    }
  }]
}, {
  input: './src/codemirror.js',
  output: {
    name: 'test',
    file: 'dist/cocreate-codemirror.js',
    format: 'iife',
    sourcemap: true
  },
  plugins: [
    debugResolve,
    nodeResolve({
      mainFields: ['module', 'browser', 'main']
    }),
    commonjs()
  ]
}]