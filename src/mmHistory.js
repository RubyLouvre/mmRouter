/*!
 * mmHistory
 * 用于监听地址栏的变化
 * https://github.com/flatiron/director/blob/master/lib/director/browser.js
 * https://github.com/visionmedia/page.js/blob/master/page.js
 */

var location = document.location
var oldIE = avalon.msie <= 7
var supportPushState = !!(window.history.pushState)
var supportHashChange = !!("onhashchange" in window && (!window.VBArray || !oldIE))
var defaults = {
    root: "/",
    html5Mode: false,
    hashPrefix: "!",
    iframeID: null, //IE6-7，如果有在页面写死了一个iframe，这样似乎刷新的时候不会丢掉之前的历史
    interval: 50, //IE6-7,使用轮询，这是其时间时隔
    fireAnchor: true, //决定是否将滚动条定位于与hash同ID的元素上
    routeElementJudger: avalon.noop // 判断a元素是否是触发router切换的链接
}
var mmHistory = {
    hash: getHash(location.href),
    check: function () {
        var h = getHash(location.href)
        if (h !== this.hash) {
            this.hash = h
            this.onHashChanged()
        }
    },
    fire: function () {
        switch (this.monitorMode) {
            case 'popstate':
                window.onpopstate()
                break
            case 'hashchange':
                window.onhashchange()
                break
            default:
                this.onHashChanged()
                break
        }

    },
    start: function (options) {
        if (this.started)
            throw new Error('avalon.history has already been started')
        this.started = true
        //监听模式

        options = avalon.mix({}, defaults, options || {})
        var html5Mode = options.html5Mode
        this.options = options
        this.mode = html5Mode ? "popstate" : "hashchange"
        if (!supportPushState) {
            if (html5Mode) {
                avalon.warn("如果浏览器不支持HTML5 pushState，强制使用hash hack!")
            }
            this.mode = "hashchange"
        }
        if (!supportHashChange) {
            this.mode = "iframepoll"
        }
        avalon.log('avalon run mmHistory in the ', this.mode, 'mode')
        //IE6不支持maxHeight, IE7支持XMLHttpRequest, IE8支持window.Element，querySelector, 
        //IE9支持window.Node, window.HTMLElement, IE10不支持条件注释
        // 支持popstate 就监听popstate
        // 支持hashchange 就监听hashchange(IE8,IE9,FF3)
        // 否则的话只能每隔一段时间进行检测了(IE6, IE7)
        switch (this.mode) {
            case "popstate" :
                // At least for now HTML5 history is available for 'modern' browsers only
                // There is an old bug in Chrome that causes onpopstate to fire even
                // upon initial page load. Since the handler is run manually in init(),
                // this would cause Chrome to run it twise. Currently the only
                // workaround seems to be to set the handler after the initial page load
                // http://code.google.com/p/chromium/issues/detail?id=63040
                setTimeout(function () {
                    window.onpopstate = mmHistory.onHashChanged
                }, 500)
                break
            case "hashchange":
                window.onhashchange = mmHistory.onHashChanged
                break
            case "iframepoll":
                avalon.ready(function () {
                    var iframe = document.createElement('iframe')
                    iframe.id = option.iframeID
                    iframe.style.display = 'none'
                    document.body.appendChild(iframe)
                    mmHistory.iframe = iframe
                    mmHistory.writeFrame('')
                    if (avalon.msie) {
                        function onPropertyChange() {
                            if (event.propertyName === 'location') {
                                mmHistory.check()
                            }
                        }
                        document.attachEvent('onpropertychange', onPropertyChange)
                        mmHistory.onPropertyChange = onPropertyChange
                    }

                    mmHistory.intervalID = window.setInterval(function () {
                        mmHistory.check()
                    }, options.interval)

                })
                break
        }

    },
    stop: function () {
        switch (this.mode) {
            case "popstate" :
                window.onpopstate = avalon.noop
                break
            case "hashchange":
                window.onhashchange = avalon.noop
                break
            case "iframepoll":
                if (this.iframe) {
                    document.body.removeChild(this.iframe)
                    this.iframe = null
                }
                if (this.onPropertyChange) {
                    document.detachEvent('onpropertychange', this.onPropertyChange)
                }
                clearInterval(this.intervalID)
                break
        }
        this.started = false
    },
    navigate: function (s, t) {//s为hash, t表示是否重写
        avalon.log('navigate', s)
        //  t && mmHistory.setHash(s)
        if (avalon.router) {
            avalon.router.setLastPath(s)//保存到本地储存或cookie
            avalon.router.navigate(s)
        }
    },
    setHash: function (s) {
        console.log('setHash', s)

        // Mozilla always adds an entry to the history
        switch (this.mode) {
            case 'iframepoll':
                this.writeFrame(s)
                break
            case 'popstate':
                window.history.pushState({}, document.title, s)
                // Fire an onpopstate event manually since pushing does not obviously
                // trigger the pop event.
                this.fire()
                break
            default:
                // console.log('sethash')
                location.hash = this.options.hashPrefix + s

                break
        }
        return this
    },
    writeFrame: function (s) {
        // IE support...
        var f = mmHistory.iframe
        var d = f.contentDocument || f.contentWindow.document
        d.open()
        d.write("<script>_hash = '" + s + "'; onload = parent.avalon.history.syncHash;<script>")
        d.close()
    },
    syncHash: function () {
        // IE support...
        var s = this._hash
        if (s !== getHash(location.href)) {
            location.hash = s
        }
        return this
    },
    getPath: function () {
        var path = location.pathname
        if (path.substr(0, 1) !== '/') {
            path = '/' + path
        }
        return path
    },
    onHashChanged: function (hash, onClick) {
        if (!onClick) {
            hash = mmHistory.mode === 'popstate' ? mmHistory.getPath() :
                    location.href.replace(/.*#!?/, '')
        }
        hash = decodeURIComponent(hash)
                
        hash = hash.charAt(0) === '/' ? hash : '/' + hash
        if (hash !== mmHistory.hash) {
            mmHistory.hash = hash
            avalon.log('onHashChanged', hash)
            if (onClick) {
                mmHistory.setHash(hash)
            }
            
            mmHistory.navigate(hash, true)
            if (onClick && mmHistory.options.fireAnchor) {
                scrollToAnchorId(hash.slice(1))
            }
        }

    }
}

function getHash(path) {
    // IE6直接用location.hash取hash，可能会取少一部分内容
    // 比如 http://www.cnblogs.com/rubylouvre#stream/xxxxx?lang=zh_c
    // ie6 => location.hash = #stream/xxxxx
    // 其他浏览器 => location.hash = #stream/xxxxx?lang=zh_c
    // firefox 会自作多情对hash进行decodeURIComponent
    // 又比如 http://www.cnblogs.com/rubylouvre/#!/home/q={%22thedate%22:%2220121010~20121010%22}
    // firefox 15 => #!/home/q={"thedate":"20121010~20121010"}
    // 其他浏览器 => #!/home/q={%22thedate%22:%2220121010~20121010%22}
    var index = path.indexOf("#")
    if (index === -1) {
        return ''
    }
    return decodeURI(path.slice(index))
}
function which(e) {
    return null === e.which ? e.button : e.which
}
function sameOrigin(href) {
    var origin = location.protocol + '//' + location.hostname
    if (location.port)
        origin += ':' + location.port
    return (href && (0 === href.indexOf(origin)))
}
//https://github.com/asual/jquery-address/blob/master/src/jquery.address.js

//劫持页面上所有点击事件，如果事件源来自链接或其内部，
//并且它不会跳出本页，并且以"#/"或"#!/"开头，那么触发updateLocation方法
// 
avalon.bind(document, "click", function (e) {
    //https://github.com/angular/angular.js/blob/master/src/ng/location.js
    //下面十种情况将阻止进入路由系列
    //1. 路由器没有启动
    if (!mmHistory.started) {
        return
    }
    //2. 不是左键点击或使用组合键
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.which === 2 || e.button === 2) {
        return
    }
    //3. 此事件已经被阻止
    if (e.returnValue === false) {
        return
    }
    //4. 目标元素不A标签,或不在A标签之内
    var el = e.path ? e.path[0] : e.target
    while (el.nodeName !== "A") {
        el = el.parentNode
        if (!el || el.tagName === "BODY") {
            return
        }
    }
    //5. 没有定义href属性或在hash模式下,只有一个#
    //IE6/7直接用getAttribute返回完整路径
    var href = el.getAttribute('href', 2) || el.getAttribute("xlink:href") || ''
    if (href.slice(0, 2) !== '#!') {
        return
    }

    //6. 目标链接是用于下载资源或指向外部
    if (el.hasAttribute('download') || el.getAttribute('rel') === 'external')
        return

    //7. 只是邮箱地址
    if (href.indexOf('mailto:') > -1) {
        return
    }
    //8. 目标链接要新开窗口
    if (el.target && el.target !== '_self') {
        return
    }

    e.preventDefault()
    mmHistory.onHashChanged(href.replace('#!', ''), true)

})
function fireRouter() {

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
    if ((el = document.getElementById(hash))) {
        el.scrollIntoView()
    } else if ((el = getFirstAnchor(document.getElementsByName(hash)))) {
        el.scrollIntoView()
    } else {
        window.scrollTo(0, 0)
    }
}

function isHasHash() {
    return !(location.hash === '' || location.hash === '#')
}


module.exports = avalon.history = mmHistory