var webpack = require('webpack')
var path = require('path')


module.exports = {
    entry: {
        mmRouter: './src/mmRouter',
        example1: './src/example1',
        example2: './src/example2',
        example3: './src/example3',
        example4: './src/example4',
        example5: './src/example5'
    },
    output: {
        path: path.join(__dirname, 'dist'),
        filename: '[name].js',
    }, //页面引用的文件

    plugins: [
    ],
    resolve: {
        extensions: ['.js', '']
    }
}

