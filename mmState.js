define(["mmRouter"], function() {
    avalon.router.route = function(method, path, query) {//判定当前URL与预定义的路由规则是否符合
        path = path.trim()
        var array = this.routingTable[method]
        for (var i = 0, el; el = array[i++]; ) {
            var args = path.match(el.regexp)
            if (args && el.abstract !== true) {
                el.query = query || {}
                el.path = path
                var params = el.params = {}
                var keys = el.keys
                args.shift()
                if (keys.length) {
                    for (var j = 0, jn = keys.length; j < jn; j++) {
                        var key = keys[j]
                        var value = args[j] || ""
                        if (typeof key.decode === "function") {//在这里尝试转换参数的类型
                            var val = key.decode(value)
                        } else {
                            try {
                                val = JSON.parse(value)
                            } catch (e) {
                                val = value
                            }
                        }
                        args[j] = params[key.name] = val
                    }
                }
                if (el.state) {
                    avalon.transitionTo(avalon.state.current, el)
                } else {
                    el.callback.apply(el, args)
                }
                return
            }
        }
        if (this.errorback) {
            this.errorback()
        }
    }
    var findNode = function(str) {
        var match = str.match(ravalon)
        var all = document.getElementsByTagName(match[1] || "*")
        for (var i = 0, el; el = all[i++]; ) {
            if (el.getAttribute(match[2]) === match[3]) {
                return el
            }
        }
    }
    var ravalon = /(\w+)\[(avalonctrl)="(\d+)"\]/

    function getViews(ctrl) {
        var v = avalon.vmodels[ctrl]
        var expr = v && v.$events.expr || "[ms-controller='" + ctrl + "']"
        var nodes = []
        if (expr) {
            if (document.querySelectorAll) {
                nodes = document.querySelectorAll(expr + " [ms-view]")
            } else {
                var root = findNode(expr)
                if (root) {
                    nodes = Array.prototype.filter.call(root.getElementsByTagName("*"), function(node) {
                        return typeof node.getAttribute("ms-view") === "string"
                    })
                }
            }
        }
        return nodes
    }
    function getNamedView(nodes, name) {
        for (var i = 0, el; el = nodes[i++]; ) {
            if (el.getAttribute("ms-view") === name) {
                return el
            }
        }
    }
    var getXHR = function() {
        return new (window.XMLHttpRequest || ActiveXObject)("Microsoft.XMLHTTP")
    }
    function fromString(template, params) {
        var promise = new Promise(function(resolve, reject) {
            var str = typeof template === "function" ? template(params) : template
            if (typeof str == "string") {
                resolve(str)
            } else {
                reject(new Error("template必须对应一个字符串或一个返回字符串的函数"))
            }
        })
        return promise
    }
    function fromUrl(url, params) {
        var promise = new Promise(function(resolve, reject) {
            if (typeof url === "function")
                url = url(params)
            if (typeof url !== "string") {
                return reject(new Error("templateUrl必须对应一个URL"))
            }
            var xhr = getXHR()
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    var status = xhr.status;
                    if (status > 399 && status < 600) {
                        reject(new Error(url + " 对应资源不存在或没有开启 CORS"))
                    } else {
                        resolve(xhr.responseText)
                    }
                }
            }
            xhr.open("GET", url, true)
            if ("withCredentials" in xhr) {
                xhr.withCredentials = true
            }
            xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest")
            xhr.send()
        })
        return promise
    }
    function fromProvider(fn, params) {
        return typeof fn === "function" ? fn(params) : fn
    }
    function fromConfig(config, params) {
        return config.template ? fromString(config.template, params) :
                config.templateUrl ? fromUrl(config.templateUrl, params) :
                config.templateProvider ? fromProvider(config.templateProvider, params) : null
    }

    function getParent(state) {
        var match = state.match(/([\.\w]+)\./) || ["", ""]
        var parentState = match[0]
        if (parentState) {
            var array = avalon.router.routingTable.get
            for (var i = 0, el; el = array[i++]; ) {
                if (el.state == parentState) {
                    return el
                }
            }
            throw new Error("必须先定义[" + parentState + "]")
        }
    }
    /*
     * 
     * state： 指定当前状态名
     * controller： 指定当前所在的VM的名字
     * template: 指定当前模板
     * parent: 父状态对象
     * 
     */
    avalon.state = function(name, opts) {
        var parent = getParent(name)
        if (parent) {
            opts.url = parent.url + opts.url
            opts.parent = parent
        }
        opts.state = name
        var callback = typeof opts.callback == "function" ? opts.callback : null
        avalon.router.get(opts.url, function() {
            var ctrl = opts.controller
            var that = this, args = arguments
            var vmodel = avalon.vmodels[ctrl]
            var views = getViews(ctrl)
            if (!opts.views) {
                var node = getNamedView(views, "")
                if (node) {
                    var a = fromConfig(opts, this.params)
                    if (a && a.then) {
                        a.then(function(s) {
                            avalon.innerHTML(node, s)
                            callback && callback.apply(that, args)
                            avalon.scan(node, vmodel)
                        })
                    }
                }
            }
        }, opts)
        return this
    }
})
