mmRouter
=============

avalon的三柱臣之一（ 路由，动画，AJAX）

<h3>如何运行GITHUB中的例子（不包括avalon_spa_example.rar）</h3>
需要执行npm install命令，安装Express 3.x 和它的依赖，location:3000

<h3>如何avalon_spa_example.rar示例</h3>
这是一个没有后台的SPA例子，请解压后，安装netBeans，新建项目，选择“基于现有源代码的HTML5应用程序”，指定解压目录， 然后点IDE的运行

<h3>路由器的相关API</h3>
http://rubylouvre.github.io/mvvm/avalon.router.html

<h3>路由器与多个VM的协作（每个VM定义在不同的JS文件中）</h3>
```javascript

//aaa.js
define("aaa", function(){
   return  avalon.define("aaa", function(vm){
        vm.path = "/aaa"
  
   })

})

//bbb.js
define("bbb", function(){
   return avalon.define("bbb", function(vm){
       
 
   })
})

//ccc.js
define("ccc", function(){
    return avalon.define("ccc", function(vm){
     
   })
})

//页面
require(["mmRouter", "aaa", "bbb", "ccc"], function(avalon, av, bv, cv){
    avalon.router.get("/aaa", function(a) {
       av.path = a
    })
    avalon.router.get("/bbb", function(a) {
        bv
    })
    avalon.router.get("/ccc", function(a) {
       cv
    })
   
    avalon.history.start({
    basepath: "/mvvm"
    })
     avalon.router.navigate("/aaa")
    avalon.scan()

})
```
thanks to  sammy， jquery-address， backbone.js，angular.js
