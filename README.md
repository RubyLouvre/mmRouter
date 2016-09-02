mmRouter
=========================

avalon的三柱臣之一（ 路由，动画，AJAX）

avalon1.* 与mmRouter的文档见[这里](https://github.com/RubyLouvre/mmRouter/blob/0.9/README.md)

这里的介绍只针对 avalon2与新的mmRouter, mmHistory


avalon2使用 webpack进行打包

```javascript

var webpack = require('webpack')
var path = require('path')


module.exports = {
    entry: {
        mmRouter: './src/mmRouter',
        example1: './src/example1', //这里你要打包的入口文件,里面会引入mmRouter,avalon2
        example2: './src/example2'
    },
    output: {
        path: path.join(__dirname, 'dist'),
        filename: '[name].js',
    }, //页面引用的文件

    plugins: [
    ],
    resolve: {
        extensions: ['.js', '', '.css']
    }
}



```


example1.js

```javascript
//加载node_modules中的avalon2/dist/avalon.js
var avalon = require('avalon2')
//加载编译好的mmRouter
require('../dist/mmRouter')
//定义VM
var vm = avalon.define({
    $id: 'test',
    currPath: ''
})
//添加路由规则
avalon.router.add("/aaa", function (a) {
    vm.currPath = this.path
})
avalon.router.add("/bbb", function (a) {
    vm.currPath = this.path
})
avalon.router.add("/ccc", function (a) {
    vm.currPath = this.path
})
avalon.router.add("/ddd/:ddd/:eee", function (a) {//:ddd为参数
    vm.currPath = this.path
})
//启动路由监听
avalon.history.start({
    root: "/mmRouter"
})
//启动扫描机制,让avalon接管页面
avalon.scan(document.body)

```
