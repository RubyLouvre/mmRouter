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
    // this里面能拿到如下东西:
    // path: 路径
    // query: 一个对象，就是？后面的东西转换成的对象
    // params: 一个对象， 我们在定义路由规则时，那些以冒号开始的参数组成的对象
})
avalon.router.add("/bbb", function (a) {
    vm.currPath = this.path
})
avalon.router.add("/ccc", function (a) {
    vm.currPath = this.path
    
})
avalon.router.add("/ddd/:ddd/:eee", function (a) {//:ddd为参数
    vm.currPath = this.path
    console.log(this.query)
    console.log(this.params)
})
//启动路由监听
avalon.history.start({
    root: "/mmRouter"
})
//启动扫描机制,让avalon接管页面
avalon.scan(document.body)

```

avalon.router.add的第二参数回调,可以返回一个字符串,作为新的hash来改写地址栏,详见example6, example7


mmHistory.start方法的配置项

```javascript
root: "/", //根路径
html5: false, //是否使用HTML5 history 
hashPrefix: "!",//
autoScroll: false //滚动

```


mmRouter的方法

###avalon.router.add(rule, cb) 
添加 一个路由规则与对象的回调, cb为rule规则中捕捉的参数

###avalon.router.error(cb)

当目标页面不匹配我们所有路由规则时, 就会执行此回调.有点像404

###avalon.router.navigate(hash, mode)

mode
0或undefined, 不改变URL, 不产生历史实体, 执行回调
1,            改变URL, 不产生历史实体,   执行回调
2,            改变URL, 产生历史实体,    执行回调

手动触发对应的回调 (见example5)


