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
mmState的使用
----------------------------------------
1、引入mmState,与等待domReady完成
```javascript
    require(["ready!", "mmState"], function() {

    })
```
2、定义顶层VM， 名字随便叫，但页面上有一个ms-controller，因为 mmState内部有一个getViews方法，通过它得到所有ms-views所在的子孙元素
`getViews("test","contacts.list")` 得到`DIV[avalonctrl="test"] [ms-view]`这样一个CSS表达式，再通过`document.querySelectorAll`
或内部为兼容IE67实现的简单选择器引擎进行元素查找。
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
avalon.state的参数与配置项与内部生成属性
-----------------------------------
```javascript
avalon.state(stateName: opts)
```
*stateName： 指定当前状态名
*url:  当前状态对应的路径规则，与祖先状态们组成一个完整的匹配规则
*controller： 指定当前所在的VM的名字（如果是顶级状态对象，必须指定）
*views: 对多个[ms-view]容器进行处理,
    每个对象应拥有template, templateUrl, templateProvider, onBeforeLoad, onAfterLoad属性
    template,templateUrl,templateProvider属性必须指定其一,要求返回一个字符串或一个Promise对象
    onBeforeLoad, onAfterLoad是可选
    如果不写views属性,则默认view为"",这四个属性可以直接写在opts对象上
    views的结构为
    {
       "": {template: "xxx", onBeforeLoad: function(){} }
       "aaa": {template: "xxx", onBeforeLoad: function(){} }
       "bbb@": {template: "xxx", onBeforeLoad: function(){} }
    }
    views的每个键名(keyname)的结构为viewname@statename，
        如果名字不存在@，则viewname直接为keyname，statename为opts.stateName
        如果名字存在@, viewname为match[0], statename为match[1]

*template: 指定当前模板，也可以为一个函数，传入opts.params作参数
*templateUrl: 指定当前模板的路径，也可以为一个函数，传入opts.params作参数
*templateProvider: 指定当前模板的提供者，它可以是一个Promise，也可以为一个函数，传入opts.params作参数
*onChange: 当切换为当前状态时调用的回调，this指向状态对象，参数为匹配的参数，
          我们可以在此方法 定义此模板用到的VM， 或修改VM的属性
*onBeforeLoad: 模板还没有插入DOM树执行的回调，this指向[ms-view]元素节点，参数为状态对象
*onAfterLoad: 模板插入DOM树执行的回调，this指向[ms-view]元素节点，参数为状态对象
*abstract:  表示它不参与匹配
*parentState: 父状态对象（框架内部生成）


<p>具体可以看http://localhost:xxx/mmRouter/index2.html 示例页面</p>

thanks to  sammy， jquery-address， backbone.js，angular.js
以后要学习一下 director
