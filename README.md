mmRouter
=============

avalon的三柱臣之一（ 路由，动画，AJAX）


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
<h2>mmState</h2>


<p>你必须在页面的某一元素节点添加ms-controller指令，然后在在ms-controllor所在元素或其子孙元素,
 绑定ms-view指令。要不会报<code>topController不存在</code>错误</p>

1、引入mmState,与等待domReady完成
```javascript
    require(["ready!", "mmState"], function() {

    })
```
2、定义顶层VM， 名字随便叫，但页面上有一个ms-controller，因为 mmState内部有一个getViews方法，通过它得到所有ms-views所在的子孙元素
`getViews("test","contacts.list")` 得到`DIV[avalonctrl="test"] [ms-view]`这样一个CSS表达式，再通过`document.querySelectorAll`
或内部为兼容IE67实现的简单选择器引擎进行元素查找
从右到左查找，先找到所有匹配[ms-view]的元素
```javascript
    require(["ready!", "mmState"], function() {
        //一个顶层VM
         avalon.define({
             $id: "test" /
         })
    })
```
3、定义各种状态，内部会转换为一个路由表，交由mmRouter去处理。
5、开始扫描
```javascript
    avalon.state("home", {
        controller: "test",
        url: "/",
        views: {
            "": {
                template: '<p class="lead">Welcome to the UI-Router Demo</p>' +
                        '<p>Use the menu above to navigate. ' +
                        'Pay attention to the <code>$state</code> and <code>$stateParams</code> values below.</p>' +
                        '<p>Click these links—<a href="#!/contacts/1">Alice</a> or ' +
                        '<a href="#!/contacts/2">Bob</a>—to see a url redirect in action.</p>'
            },
            'hint@': {
                template: "当前状态是home"
            }
        }

    })
```
注意，第一个状态，<b>必须指定controller</b>，controller为顶层VM的`$id`。
注意，添加状态的顺序，必须先添加aaa, 再添加aaa.bbb，再添加aaa.bbb.ccc，不能先添加aaa.bbb，再添加aaa
4、启动路由
5、开始扫描
```javascript
    avalon.history.start({
        basepath: "/mmRouter"
    })
```
5、开始扫描
```javascript
   avalon.scan()
```

<p>具体可以看http://localhost:xxx/mmRouter/index2.html 示例页面</p>

thanks to  sammy， jquery-address， backbone.js，angular.js
以后要学习一下 director
