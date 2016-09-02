var webpack = require('webpack')

var path = require('path')
var node_modules = path.resolve(__dirname, 'node_modules')

function heredoc(fn) {
    return fn.toString().replace(/^[^\/]+\/\*!?\s?/, '').
            replace(/\*\/[^\/]+$/, '').trim().replace(/>\s*</g, '><')
}
var now = new Date
var snow = now.getFullYear() + '-' + (now.getMonth() + 1) +
        '-' + now.getDate() + ':' + now.getHours()
var fs = require('fs')
var avalonPath = path.resolve(node_modules, 'avalon2/dist/avalon.js')
fs.readFile(avalonPath, 'utf8', function (e, text) {
    fs.writeFile(path.resolve(__dirname, './dist/avalon.js'), text)
})

var api = heredoc(function () {
    /*
     avalon的路由组件
     
     ```   
     */
})

module.exports = {
    entry: {
        mmRouter: './src/mmRouter',
        built: './src/built'
    },
    output: {
        path: path.join(__dirname, 'dist'),
        filename: '[name].js',
         //libraryTarget: 'umd',
        // library: 'avalon'
    }, //页面引用的文件

    module: {
        loaders: [
            //http://react-china.org/t/webpack-extracttextplugin-autoprefixer/1922/4
            // https://github.com/b82/webpack-basic-starter/blob/master/webpack.config.js 
            {test: /\.html$/, loader: 'raw!html-minify'},
            {test: /\.(ttf|eot|svg|woff2?)((\?|#)[^\'\"]+)?$/, loader: 'file-loader?name=[name].[ext]'}

        ]
    },
    plugins: [
        new webpack.BannerPlugin('built in ' + snow + ' by 司徒正美\n' + api),

    ],
    resolve: {
        extensions: ['.js', '', '.css']
    }
}

