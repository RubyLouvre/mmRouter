mmHistory
=======

mmRouter的重构部位之一,用于负责监听地址栏的变化,只要`require("mmHistory")`,就会在avalon添加history对象.


avalon.history拥有两个重要方法start与stop

###start
```
avalon.history.start()
avalon.history.start(true) //相当于avalon.history.start({html5Mode:true})
avalon.history.start(opts)
```

opts拥有如下配置项
1.   root: "/"
2.   html5Mode: false
3.   iframeID: null, 用于IE6-7
4.   interval: 50,   用于IE6-7, 轮询iframe的毫秒数
5.   fireAnchor: true, //决定是否将滚动条定位于与hash同ID的元素上

###stop

用于停止监听
