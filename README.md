mmRouter
=============

avalon的三柱臣之一（ 路由，动画，AJAX）


例子，需要执行npm install命令，安装Express 3.x 和它的依赖，location:3000

或者看这里
http://rubylouvre.github.io/mvvm/avalon.router.html

路由器与多个VM的协作（每个VM定义在不同的JS文件中）
```javascript

//aaa.js
define("aaa", function(){
   return  avalon.define("aaa", function(vm){
       
 
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
       av
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
    avalon.scan()

})
```
