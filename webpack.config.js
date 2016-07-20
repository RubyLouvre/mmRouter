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
        mmRouter: './src/mmRouter'
    },
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'mmRouter.js',
        // libraryTarget: 'umd',
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
//        new webpack.ProvidePlugin({
//            $: 'jquery', //加载$全局
//            'window.avalon': 'avalon2' //加载 avalon 全局 [******这里必须强制 window.avalon]
//        }),
    ],
    resolve: {
//        alias: {
//            'jquery': path.resolve(__dirname, 'app/_lib/jQuery-3.0.0.js'),
//            'avalon': path.resolve(node_modules, 'avalon2/dist/avalon.js')//这里就可以改成avalon.modern
//        },
        extensions: ['.js', '', '.css']
    }
}

