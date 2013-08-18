define(["avalon"], function(avalon) {
    var History = avalon.History = function() {
        this.location2hash = {}
    };
    var proxy

    var rthimSlant = /^\/+|\/+$/g  // 去最左右两边的斜线
    var rleftSlant = /^\//         //最左的斜线
    var rhashBang = /^\/#(!)?\//   //匹配/#/ 或 /#!/
    var rhashIE = /^[^#]*(#.+)$/
    var anchorElement = document.createElement('a')

    History.started = false;
    History.IEVersion = (function() {
        var mode = document.documentMode
        return mode ? mode : window.XMLHttpRequest ? 7 : 6
    })();

    var lastIframeHash = ""
    var lastDocumentHash = ""
    var checkerRunning = false;
    var defaults = {basepath: '/', html5Mode: true, hashPrefix: "!", interval: 50}


    History.prototype = {
        constructor: History,
        start: function(options) {
            if (History.started)
                throw new Error("avalon.history has already been started");
            History.started = true;
            this.options = avalon.mix({}, defaults, this.options, options);

            //IE6不支持maxHeight, IE7支持XMLHttpRequest, IE8支持window.Element，querySelector, 
            //IE9支持window.Node, window.HTMLElement, IE10不支持条件注释

            var oldIE = window.VBArray && History.IEVersion <= 7
            //延迟检测
            this.supportPushState = !!(window.history.pushState);
            this.supportHashChange = !!('onhashchange' in window && (!window.VBArray || !oldIE))

            this.html5Mode = this.options.html5Mode;
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

            if (oldIE && !this.html5Mode) {
                //IE6,7在hash改变时不会产生历史，需要用一个iframe来共享历史
                var iframe = avalon.parseHTML('<iframe src="#" tabindex="-1" style="display:none" />').firstChild
                document.body.appendChild(iframe)
                this.iframe = iframe.contentWindow;
                this.iframe.document.open().close();
                var startedWithHash = !!proxy.getHash(location.href)
            }

            // 支持popstate 就监听popstate
            // 支持hashchange 就监听hashchange
            // 否则的话只能每隔一段时间进行检测了
            var lastLocation = location.href
            function checkUrl() {
                var currLocation = location.href
                if (proxy && (lastLocation !== currLocation)) {
                    lastLocation = currLocation
                    var hash = proxy.location2hash[ lastLocation ]
                    if (avalon.vmodels.xxx) {
                        avalon.vmodels.xxx.currPath = hash
                    }
                }
            }
            //thanks https://github.com/browserstate/history.js/blob/master/scripts/uncompressed/history.html4.js#L272
            function checkUrlIE() {
                if (checkerRunning) {
                    return false;
                }
                checkerRunning = true;
                var idoc = proxy.iframe.document
                var documentHash = proxy.location2hash[ location.href ] || ""
                var iframeHash = proxy.location2hash[ idoc.URL ]
                if (documentHash !== lastDocumentHash) {//如果是用户点击页面的链接触发
                    lastDocumentHash = documentHash;
                    if (iframeHash !== documentHash) {
                        lastIframeHash = iframeHash = documentHash;
                        idoc.open().close();//创建历史记录
                        idoc.location.hash = documentHash.replace(rleftSlant, "")
                    }
                    if (avalon.vmodels.xxx) {
                        avalon.vmodels.xxx.currPath = documentHash
                    }
                } else if (iframeHash !== lastIframeHash) {//如果是后退按钮触发hash不一致
                    lastIframeHash = iframeHash;
                    if (startedWithHash && iframeHash === '') {
                        history.go(-1);
                    } else {
                        if (iframeHash === "") {
                            window.location = proxy.basepath + "/"
                        } else {
                            location.hash = iframeHash.replace(rleftSlant, "")
                        }
                    }
                }
                checkerRunning = false;
            }
            if (this.html5Mode) {
                this.checkUrl = avalon.bind(window, 'popstate', checkUrl)
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
            clearInterval(this.checkUrl);
            History.started = false;
        },
        getHash: function(url) {
            var matches = url.toString().match(rhashIE);
            return matches ? matches[1] : '';
        },
        getfullPath: function(url) {
            return [url.pathname, url.search, this.getHash(url)].join('');
        },
        getLocation: function() {
            return this.getfullPath(window.location);
        },
        setLocation: function(path) {
            if (path.charAt(0) !== "/" && path.charAt(0) !== "?") {
                path = "/" + path
            }
            var prefix = "/#" + this.options.hashPrefix + "/"
            if (rhashBang.test(path)) {
                if (this.html5Mode) {//如果支持HTML5 history 新API
                    path = path.replace(rhashBang, "/")
                } else {
                    path = path.replace(rhashBang, prefix)
                }
            } else {
                if (!this.html5Mode) {//如果支持HTML5 history 新API
                    path = prefix + path.replace(rleftSlant, "");
                }
            }
            if (path !== this.getLocation()) {
                this.location2hash[ this.basepath + path ] = path
                if (this.html5Mode && rleftSlant.test(path)) {
                    history.pushState({path: path}, window.title, path)
                } else {
                    return (window.location = path)
                }
            }
        }
    }


    function getFirstAnchor(list) {
        var result = null;
        avalon.each(list, function(element) {
            if (!result && element.nodeName === 'A')
                result = element;
        });
        return result;
    }

    function scrollToAnchorId(hash) {
        var elem;
        hash = hash.replace(/^#/, '')
        // empty hash, scroll to the top of the page
        if (!hash)
            window.scrollTo(0, 0);

        // element with given id
        else if ((elem = document.getElementById(hash)))
            elem.scrollIntoView();

        // first anchor with given name :-D
        else if ((elem = getFirstAnchor(document.getElementsByName(hash))))
            elem.scrollIntoView();

        // no element and hash == 'top', scroll to the top of the page
        else if (hash === 'top')
            window.scrollTo(0, 0);
    }
    //判定A标签的target属性是否指向自身
    //thanks https://github.com/quirkey/sammy/blob/master/lib/sammy.js#L219
    History.targetIsThisWindow = function targetIsThisWindow(targetWindow) {
        if (!targetWindow || targetWindow === window.name || targetWindow === '_self') {
            return true;
        }
        if (targetWindow === '_blank') {
            return false;
        }
        if (targetWindow === 'top' && window === window.top) {
            return true;
        }
        return false;
    };
    //https://github.com/quirkey/sammy/blob/master/lib/sammy.js
    //https://github.com/asual/jquery-address/blob/master/src/jquery.address.js
    //https://github.com/jashkenas/backbone/blob/master/backbone.js
    proxy = avalon.history = new History;

    avalon.bind(document, "click", function(event) {
        var defaultPrevented = "defaultPrevented" in event ? event['defaultPrevented'] : event.returnValue === false
        if (defaultPrevented || event.ctrlKey || event.metaKey || event.which === 2)
            return;
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
            event.preventDefault();
            proxy.setLocation(target.getAttribute("href", 2).replace(proxy.rbasepath, ""));
            return false;
        }

    })

    avalon.require("ready!", function() {
        proxy.start({html5Mode: false})
    })


    return avalon
})

