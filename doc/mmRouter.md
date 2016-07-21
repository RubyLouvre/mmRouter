mmRouter
====

avalon的三柱臣之一（ 路由，动画，AJAX）

使用时需要先引入avalon2,或者与avalon全部打成一个JS文件

```html
<script src="./dist/avalon.js"></script>
<script src="./dist/mmRouter.js"></script>

```

我们需要先定义路由规则,再启动history管理器.
```
avalon.route.add(rule1, cb1)
avalon.route.add(rule2, cb2)
avalon.route.add(rule3, cb3)
avalon.route.add(rule4, cb4)
//...
avalon.history.start()

```

然后页面上所有要跳转的链接全部改成以｀#!`开头.

```html
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <title>路由系统</title>
        <script src="./dist/avalon.js"></script>
        <script src="./dist/mmRouter.js"></script>
        <script>
                var model = avalon.define({
                    $id: 'xxx',
                    currPath: ''
                })
                avalon.router.add("/aaa", function (a) {
                    model.currPath = this.path
                })
                avalon.router.add("/bbb", function (a) {
                    model.currPath = this.path
                })
                avalon.router.add("/ccc", function (a) {
                    model.currPath = this.path
                })
                avalon.router.add("/ddd/:ddd/:eee", function (a) {//:ddd为参数
                    model.currPath = this.path
                })
                avalon.router.add("/:ddd", function (a) {
                    model.currPath = this.path
                })
                avalon.history.start({
                    root: "/avalon"
                })
                avalon.scan()
           //
        </script>
    </head>
    <body >
        <div ms-controller="xxx">
            <ul>
                <li><a href="#!/aaa">aaa</a></li>
                <li><a href="#!/bbb">bbb</a></li>
                <li><a href="#!/ccc">ccc</a></li>
                <li><a href="#!/ddd/222/yyy">ddd</a></li>
                <li><a href="#!/你好 啊">eee</a></li>
            </ul>
            <div style="color:red">{{@currPath}}</div>
            <div style="height: 600px;width:1px;">

            </div>
            <p id="eee">会定位到这里</p>
        </div>

    </body>
</html>

```