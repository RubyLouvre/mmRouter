var webpack = require('webpack')
var path = require('path')


module.exports = {
    entry: {
        mmRouter: './src/mmRouter',
        example1: './src/example1',
        example2: './src/example2',
        example3: './src/example3',
        example4: './src/example4',
        example5: './src/example5',
        example6: './src/example6',
        example7: './src/example7'
    },
    output: {
        path: path.join(__dirname, 'dist'),
        filename: '[name].js',
    }, //页面引用的文件
    module: {
        loaders: [
            //http://react-china.org/t/webpack-extracttextplugin-autoprefixer/1922/4
            // https://github.com/b82/webpack-basic-starter/blob/master/webpack.config.js 
            {test: /\.html$/, loader: 'raw!html-minify'},
        ]
    },
    resolve: {
        extensions: ['.js', '']
    }
}

