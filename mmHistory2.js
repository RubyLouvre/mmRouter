/*!
 * mmHistory
 * 用于监听地址栏的变化
 * https://github.com/flatiron/director/blob/master/lib/director/browser.js
 * https://github.com/visionmedia/page.js/blob/master/page.js
 */
var avalon = require('avalon2')

var location = document.location
var oldIE = avalon.msie <= 7
var supportPushState = !!(window.history.pushState)
var supportHashChange = !!("onhashchange" in window && (!window.VBArray || !oldIE))

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
    start: function (html5Mode) {
        if (this.started)
            throw new Error('avalon.history has already been started')
        this.started = true
        //监听模式
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
                    }, 50)

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
        avalon.log(s)
        t && mmHistory.setHash(s)
        if (avalon.router) {
            avalon.router.setLastPath(s)//保存到本地储存或cookie
            avalon.router.navigate(s)
        }
    },
    setHash: function (s) {
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
                console.log('sethash')
                location.hash = (s[0] === '/') ? s : '/' + s
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
   
    onHashChanged: function (e) {
        var newURL = e && e.newURL || getHash(location.href)
        var url = mmHistory.mode === 'popstate' ? mmHistory.getPath() : newURL.replace(/.*#/, '')
        console.log(url,'---',e)
        mmHistory.setHash( url.charAt(0) === '/' ? url : '/' + url)
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
    return decodeURI(path.slice(path.indexOf("#")))
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
    //下面十种情况将阻止进入路由系列
    //1. 路由器没有启动
    if (!mmHistory.started) {
        return
    }
    //2. 不是左键点击
    if (1 !== which(e)) {
        return
    }
    //3. 使用组合钕
    if (e.metaKey || e.ctrlKey || e.shiftKey) {
        return
    }
    //4. 此事件已经被阻止
    if (e.returnValue === false) {
        return
    }
    //5. 目标元素不A标签,或不在A标签之内
    var el = e.path ? e.path[0] : e.target
    while (el.nodeName !== "A") {
        el = el.parentNode
        if (!el || el.tagName === "BODY") {
            return
        }
    }
    //6. 没有定义href属性或在hash模式下,只有一个#
    var href = el.getAttribute('href') || el.getAttribute("xlink:href") || ''
    if (href.slice(0,2) !== '#!') {
        return
    }

    //7. 目标链接是用于下载资源或指向外部
    if (el.hasAttribute('download') || el.getAttribute('rel') === 'external')
        return

    //8. 只是邮箱地址
    if (href.indexOf('mailto:') > -1) {
        return
    }
    //9. 目标链接要新开窗口
    if (!targetIsThisWindow(el.target)) {
        return
    }

    e.preventDefault()
    console.log('222222222')
    href = href.replace('#!','')
    mmHistory.navigate(href, true)
    mmHistory.fireAnchor && scrollToAnchorId(href)
})

//判定A标签的target属性是否指向自身
//thanks https://github.com/quirkey/sammy/blob/master/lib/sammy.js#L219
function targetIsThisWindow(targetWindow) {
    if (!targetWindow || targetWindow === window.name || targetWindow === '_self' || (targetWindow === 'top' && window == window.top)) {
        return true
    }
    return false
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