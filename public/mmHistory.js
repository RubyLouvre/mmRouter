define(["avalon"], function(avalon) {
    var proxy
    var defaults = {
        basepath: '/',
        html5Mode: false,
        hashPrefix: "!",
        interval: 50, //IE6-7,使用轮询，这是其时间时隔
        fireAnchor: true//决定是否将滚动条定位于与hash同ID的元素上
    }
    var History = avalon.History = function() {
        this.location2hash = {}
        this.options = defaults
    }

    var rthimSlant = /^\/+|\/+$/g  // 去最左右两边的斜线
    var rleftSlant = /^\//         //最左的斜线
    var rhashBang = /^#(!)?\//   //匹配/#/ 或 /#!/
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
    var oldIE = window.VBArray && History.IEVersion <= 7
    History.prototype = {
        constructor: History,
        start: function(options) {
            if (History.started)
                throw new Error("avalon.history has already been started")
            History.started = true
            this.options = avalon.mix({}, this.options, options)
            //IE6不支持maxHeight, IE7支持XMLHttpRequest, IE8支持window.Element，querySelector, 
            //IE9支持window.Node, window.HTMLElement, IE10不支持条件注释


            //延迟检测
            this.supportPushState = !!(window.history.pushState)
            this.supportHashChange = !!('onhashchange' in window && (!window.VBArray || !oldIE))

            this.html5Mode = !!this.options.html5Mode
            if (!this.supportPushState) {
                avalon.log("如果浏览器不支持HTML5 pushState，强制使用hash hack!")
                this.html5Mode = false
            }

            anchorElement.href = ('/' + this.options.basepath + '/').replace(rthimSlant, '/')
            var fullpath = History.getAbsolutePath(anchorElement)

            anchorElement.href = "/"
            var rootpath = History.getAbsolutePath(anchorElement)

            this.basepath = fullpath.replace(/\/$/, "")
            this.rootpath = rootpath.replace(/\/$/, "")

            this.rbasepath = new RegExp("^" + this.basepath, "i")
            this.rrootpath = new RegExp("^" + this.rootpath, "i")

            this.location2hash[this.basepath] = ""
            this.location2hash[fullpath] = ""

            var html = '<!doctype html><html><body>@</body></html>'
            if (this.options.domain) {
                html = html.replace("<body>", "<script>document.domain =" + this.options.domain + "</script><body>")
            }
            if (oldIE && !this.html5Mode) {
                //IE6,7在hash改变时不会产生历史，需要用一个iframe来共享历史
                avalon.ready(function() {
                    var iframe = avalon.parseHTML('<iframe src="javascript:0"  tabindex="-1" style="display:none" />').firstChild
                    document.body.appendChild(iframe)
                    proxy.iframe = iframe.contentWindow
                    var idoc = proxy.iframe.document
                    idoc.open()
                    idoc.write(html)
                    idoc.close()
                })
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
                    execRouter(hash)
                }
            }
            function execRouter(hash) {
                var router = avalon.router
                hash = hash.replace(rhashBang, "/")
                if (router && router.navigate) {
                    router.setLatelyPath(hash)
                    router.navigate(hash)
                }
                if (proxy.options.fireAnchor)
                    scrollToAnchorId(hash)
            }
            //thanks https://github.com/browserstate/history.js/blob/master/scripts/uncompressed/history.html4.js#L272
            function checkUrlIE() {
                if (checkerRunning || !proxy.iframe) {
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
                        idoc.location.hash = documentHash
                    }
                    execRouter(documentHash)
                } else if (iframeHash !== lastIframeHash) {//如果是后退按钮触发hash不一致
                    lastIframeHash = iframeHash
                    if (startedWithHash && iframeHash === '') {
                        history.go(-1)
                    } else {
                        location.hash = iframeHash
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
            if (this.html5Mode === false) {
                if (this.basepath === location.href.replace(/\/$/, "")) {
                    execRouter("/")
                } else if (location.href.indexOf("#!") !== -1) {
                    var hash = location.href.split("#!")[1]
                    this.location2hash[ location.href ] = "#" + this.options.hashPrefix + "/" + hash.replace(rleftSlant, "")
                    execRouter(hash)
                }
            } else if (this.html5Mode === true && this.rbasepath.test(location.href)) {
                execRouter(RegExp.rightContext)
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
        setLocation: function(path, hash) {
            var prefix = "#" + this.options.hashPrefix + "/"
            if (!this.html5Mode) {//如果支持HTML5 history 新API
                var IEhash = prefix + hash.replace(rleftSlant, "")
            }

            if (path !== this.getLocation()) {
                if (this.html5Mode && rleftSlant.test(path)) {
                    history.pushState({path: path}, window.title, path)
                    this.location2hash[ location.href ] = hash
                    avalon.nextTick(proxy._fireLocationChange) //由于没有hashchange, setInterval回调做殿后，需要自己擦屁股
                } else {
                    window.location.hash = IEhash
                    this.location2hash[ location.href ] = IEhash
                }
            }
        }
    }

    //得到页面第一个符合条件的A标签
    function getFirstAnchor(list) {
        for (var i = 0, el; el = list[i++]; ) {
            if (el.nodeName === "A") {
                return el
            }
        }
    }

    function scrollToAnchorId(hash, el) {
        hash = hash.replace(rleftSlant, '').replace(/#.*/, '')
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
    History.getAbsolutePath = function(a) {
        return !a.hasAttribute ? a.getAttribute("href", 4) : a.href
    }
    //https://github.com/asual/jquery-address/blob/master/src/jquery.address.js
    proxy = avalon.history = new History
    var rurl = /^([\w\d]+):\/\/([\w\d\-_]+(?:\.[\w\d\-_]+)*)/
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
        if (!hostname) {//fix IE下通过ms-href动态生成href，不存在hostname属性的BUG
            var fullHref = !oldIE ? target + "" : target.getAttribute("href", 4)
            hostname = (fullHref.match(rurl) || ["", "", ""])[2]//小心javascript:void(0)

        }
        if (hostname === window.location.hostname && History.targetIsThisWindow(target.target)) {
            var path = target.getAttribute("href", 2)
            if (oldIE && path.indexOf("#") !== -1) {
                path = path.slice(path.indexOf("#"))
            }
            if (~path.indexOf("#/") || ~path.indexOf("#!/")) {
                anchorElement.href = ('/' + proxy.options.basepath + '/').replace(rthimSlant, '/') + path.slice(2)
                var href = History.getAbsolutePath(anchorElement)
                event.preventDefault()
                proxy.setLocation(href.replace(proxy.rrootpath, ""), href.replace(proxy.rbasepath, ""))
                return false
            }
        }

    })

    return avalon
})

// 主要参数有 basepath  html5Mode  hashPrefix  interval domain fireAnchor
