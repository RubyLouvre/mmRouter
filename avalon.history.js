define(["avalon"], function(avalon) {
    var History = avalon.History = function() {
        this.location2hash = {}
    }
    var proxy

    var rthimSlant = /^\/+|\/+$/g  // 去最左右两边的斜线
    var rleftSlant = /^\//         //最左的斜线
    var rhashBang = /^\/#(!)?\//   //匹配/#/ 或 /#!/
    var rhashIE = /^[^#]*(#.+)$/
    var anchorElement = document.createElement('a')

    History.started = false
    History.IEVersion = (function() {
        var mode = document.documentMode
        return mode ? mode : window.XMLHttpRequest ? 7 : 6
    })()

    var lastIframeHash = ""
    var lastDocumentHash = ""
    var checkerRunning = false
    var defaults = {basepath: '/', html5Mode: true, hashPrefix: "!", interval: 50}


    History.prototype = {
        constructor: History,
        start: function(options) {
            if (History.started)
                throw new Error("avalon.history has already been started")
            History.started = true
            this.options = avalon.mix({}, defaults, this.options, options)

            //IE6不支持maxHeight, IE7支持XMLHttpRequest, IE8支持window.Element，querySelector, 
            //IE9支持window.Node, window.HTMLElement, IE10不支持条件注释

            var oldIE = window.VBArray && History.IEVersion <= 7
            //延迟检测
            this.supportPushState = !!(window.history.pushState)
            this.supportHashChange = !!('onhashchange' in window && (!window.VBArray || !oldIE))

            this.html5Mode = !!this.options.html5Mode
            if (!this.supportPushState) {
                avalon.log("如果浏览器不支持HTML5 pushState，强制使用hash hack!")
                this.html5Mode = false
            }

            anchorElement.href = ('/' + this.options.basepath + '/').replace(rthimSlant, '/')
            var fullpath = !anchorElement.hasAttribute ? anchorElement.getAttribute("href", 4) : anchorElement.href

            this.basepath = fullpath.replace(/\/$/, "") //补全路径
            this.rbasepath = new RegExp("^" + fullpath, "i")
            this.location2hash[this.basepath] = ""
            this.location2hash[fullpath] = ""
            var html = '<!doctype html><html><body>@</body></html>'
            if (this.options.domain) {
                html = html.replace("<body>", "<script>document.domain =" + this.options.domain + "</script><body>")
            }
            if (oldIE && !this.html5Mode) {
                //IE6,7在hash改变时不会产生历史，需要用一个iframe来共享历史
                var iframe = avalon.parseHTML('<iframe src="javascript:0"  tabindex="-1" style="display:none" />').firstChild
                document.body.appendChild(iframe)
                this.iframe = iframe.contentWindow
                var idoc = this.iframe.document
                idoc.open()
                idoc.write(html)
                idoc.close()
                var startedWithHash = !!History.getHash(location.href)
            }

            // 支持popstate 就监听popstate
            // 支持hashchange 就监听hashchange
            // 否则的话只能每隔一段时间进行检测了
            var lastLocation = location.href
            function checkUrl() {
                var currLocation = location.href
                if (proxy && (lastLocation !== currLocation)) {
                    lastLocation = currLocation
                    var hash = proxy.location2hash[ lastLocation ] || ""
                    if (avalon.vmodels.xxx) {
                        avalon.vmodels.xxx.currPath = hash
                    }
                    scrollToAnchorId(hash)
                }
            }
            //thanks https://github.com/browserstate/history.js/blob/master/scripts/uncompressed/history.html4.js#L272
            function checkUrlIE() {
                if (checkerRunning) {
                    return false
                }
                checkerRunning = true
                var idoc = proxy.iframe.document
                var documentHash = proxy.location2hash[ document.URL ] || ""
                var iframeHash = proxy.location2hash[ idoc.URL ] || ""
                if (documentHash !== lastDocumentHash) {//如果是用户点击页面的链接触发
                    lastDocumentHash = documentHash
                    if (iframeHash !== documentHash) {
                        lastIframeHash = iframeHash = documentHash
                        idoc.open()//创建历史记录
                        idoc.write(html)
                        idoc.close()
                        idoc.location.hash = documentHash.replace(rleftSlant, "")
                    }
                    if (avalon.vmodels.xxx) {
                        avalon.vmodels.xxx.currPath = documentHash
                    }
                    scrollToAnchorId(documentHash)
                } else if (iframeHash !== lastIframeHash) {//如果是后退按钮触发hash不一致
                    lastIframeHash = iframeHash
                    if (startedWithHash && iframeHash === '') {
                        history.go(-1)
                    } else {
                        location.hash = iframeHash.replace(rleftSlant, "")
                    }
                }
                checkerRunning = false
            }
            if (this.html5Mode) {
                this.checkUrl = avalon.bind(window, 'popstate', checkUrl)
                this._fireLocationChange = checkUrl
            } else if (this.supportHashChange) {//IE 8, 9与其他不支持push state的浏览器使用hashchange
                this.checkUrl = avalon.bind(window, 'hashchange', checkUrl)
            } else {//IE 6 7下使用定时器监听URL的变动"
                this.checkUrl = setInterval(checkUrlIE, this.options.interval)
            }
        },
        // 中断URL的监听
        stop: function() {
            avalon.unbind(window, "popstate", this.checkUrl)
            avalon.unbind(window, "hashchange", this.checkUrl)
            clearInterval(this.checkUrl)
            History.started = false
        },
        getLocation: function() {
            return History.getfullPath(window.location)
        },
        setLocation: function(path) {
            //处理#aaa这样的路由
            if (path.charAt(0) === "#" && path.charAt(1) !== "/") {
                var hash = path
            }
            //处理http://localhost:3000/eee这样的路由，到时会变成eee，需要变成/eee
            if (path.charAt(0) !== "/" && path.charAt(0) !== "?") {
                path = "/" + path
            }
            var prefix = "/#" + this.options.hashPrefix + "/"

            if (rhashBang.test(path)) {
                //如果支持HTML5 history 新API
                path = path.replace(rhashBang, (this.html5Mode ? "/" : prefix))
            } else {
                if (!this.html5Mode) {//如果支持HTML5 history 新API
                    path = prefix + path.replace(rleftSlant, "")
                }
            }
            if (path !== this.getLocation()) {
                if (this.html5Mode && rleftSlant.test(path)) {
                    history.pushState({path: path}, window.title, path)
                    this.location2hash[ location.href ] = hash ? hash : path
                    avalon.nextTick(proxy._fireLocationChange) //由于没有hashchange, setInterval回调做殿后，需要自己擦屁股
                } else {
                    if (hash) {//IE6-8 不支持http://localhost:3000/#!/#fff，会直接刷新页面
                        window.location.hash = hash
                    } else {
                        window.location = path
                    }
                    this.location2hash[ location.href ] = hash ? hash : path
                }
            }
        }
    }


    function getFirstAnchor(list) {
        for (var i = 0, el; el = list[i++]; ) {
            if (el.nodeName === "A") {
                return el
            }
        }
    }

    function scrollToAnchorId(hash, el) {
        hash = hash.replace(/[^#]*#/, '').replace(/#.*/, '')
        hash = decodeURIComponent(hash)
        if ((el = document.getElementById(hash))) {
            el.scrollIntoView()
        } else if ((el = getFirstAnchor(document.getElementsByName(hash)))) {
            el.scrollIntoView()
        } else {
            window.scrollTo(0, 0)
        }
    }

    //判定A标签的target属性是否指向自身
    //thanks https://github.com/quirkey/sammy/blob/master/lib/sammy.js#L219
    History.targetIsThisWindow = function targetIsThisWindow(targetWindow) {
        if (!targetWindow || targetWindow === window.name || targetWindow === '_self' || (targetWindow === 'top' && window == window.top)) {
            return true
        }
        return false
    }
    // IE6直接用location.hash取hash，可能会取少一部分内容
    // 比如 http://www.cnblogs.com/rubylouvre#stream/xxxxx?lang=zh_c
    // ie6 => location.hash = #stream/xxxxx
    // 其他浏览器 => location.hash = #stream/xxxxx?lang=zh_c
    // firefox 会自作多情对hash进行decodeURIComponent
    // 又比如 http://www.cnblogs.com/rubylouvre/#!/home/q={%22thedate%22:%2220121010~20121010%22}
    // firefox 15 => #!/home/q={"thedate":"20121010~20121010"}
    // 其他浏览器 => #!/home/q={%22thedate%22:%2220121010~20121010%22}
    History.getHash = function(url) {
        var matches = url.toString().match(rhashIE)
        return matches ? matches[1] : ""
    }
    History.getfullPath = function(url) {
        return [url.pathname, url.search, History.getHash(url)].join("")
    }
    //https://github.com/asual/jquery-address/blob/master/src/jquery.address.js
    proxy = avalon.history = new History

    avalon.bind(document, "click", function(event) {
        var defaultPrevented = "defaultPrevented" in event ? event['defaultPrevented'] : event.returnValue === false
        if (defaultPrevented || event.ctrlKey || event.metaKey || event.which === 2)
            return
        var target = event.target
        while (target.nodeName !== "A") {
            target = target.parentNode
            if (!target || target.nodeName === "Body") {
                return
            }
        }

        var hostname = target.hostname

        if (hostname === window.location.hostname && proxy.rbasepath.test(target.href) &&
                History.targetIsThisWindow(target.target)) {
            event.preventDefault()
            proxy.setLocation(target.getAttribute("href", 2).replace(proxy.rbasepath, ""))
            return false
        }

    })

    avalon.require("ready!", function() {
        proxy.start({html5Mode: true})
    })


    return avalon
})

