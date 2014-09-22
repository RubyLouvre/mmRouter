define("mmState", ["mmRouter"], function() {
//重写mmRouter中的route方法     
    avalon.router.route = function(method, path, query) {
        path = path.trim()
        var array = this.routingTable[method]

        for (var i = 0, el; el = array[i++]; ) {//el为一个个状态对象，状态对象的callback总是返回一个Promise
            var args = path.match(el.regexp)
            if (args && el.abstract !== true) {//不能是抽象状态
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
                    mmState.transitionTo(mmState.currentState, el, args)
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

    //得到所有要处理的视图容器
    function getViews(ctrl, name) {
        var v = avalon.vmodels[ctrl]
        var firstExpr = v && v.$events.expr || "[ms-controller='" + ctrl + "']"
        var otherExpr = []
        name.split(".").forEach(function() {
            otherExpr.push("[ms-view]")
        })

        if (document.querySelectorAll) {
            return document.querySelectorAll(firstExpr + " " + otherExpr.join(" "))
        } else {
            var seeds = Array.prototype.filter.call(document.getElementsByTagName("*"), function(node) {
                return typeof node.getAttribute("ms-view") === "string"
            })
            while (otherExpr.length > 1) {
                otherExpr.pop()
                seeds = matchSelectors(seeds, function(node) {
                    return typeof node.getAttribute("ms-view") === "string"
                })
            }
            seeds = matchSelectors(seeds, function(node) {
                return typeof node.getAttribute("ms-controller") === ctrl
            })
            return seeds.map(function(el) {
                return el.node
            })
        }
    }
    function  matchSelectors(array, match) {
        for (var i = 0, n = array.length; i < n; i++) {
            matchSelector(i, array, match)
        }
        return array.filter(function(el) {
            return el
        })
    }

    function matchSelector(i, array, match) {
        var parent = array[i]
        var node = parent
        if (parent.node) {
            parent = parent.parent
            node = parent.node
        }
        while (parent) {
            if (match(parent)) {
                return array[i] = {
                    node: node,
                    parent: parent
                }
            }
            parent = parent.parentNode
        }
        array[i] = false
    }



    function getNamedView(nodes, name) {
        for (var i = 0, el; el = nodes[i++]; ) {
            if (el.getAttribute("ms-view") === name) {
                return el
            }
        }
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
    var getXHR = function() {
        return new (window.XMLHttpRequest || ActiveXObject)("Microsoft.XMLHTTP")
    }
    function fromUrl(url, params) {
        var promise = new Promise(function(resolve, reject) {
            if (typeof url === "function") {
                url = url(params)
            }
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
        var parentState = match[1]
        if (parentState) {
            var array = avalon.router.routingTable.get
            for (var i = 0, el; el = array[i++]; ) {
                if (el.state === parentState) {
                    return el
                }
            }
            throw new Error("必须先定义[" + parentState + "]")
        }
    }
    var mmState = {
        currentState: null,
        transitionTo: function(fromState, toState, args) {
            mmState.currentState = toState
            var states = []
            var t = toState
            if (!fromState) {
                while (t) {
                    states.push(t)
                    t = t.parent
                }
            } else if (fromState === toState) {
                states.push(t)
            } else {
                while (t && t !== fromState) {
                    states.push(t)
                    t = t.parent
                }
            }
            states.reverse();
            var out = new Promise(function(resolve) {
                resolve()
            })
            states.forEach(function(state) {
                out = out.then(function() {
                    return  state.callback.apply(state, args)
                })
            })
        }
    }
    //用于收集可用于扫描的vmodels
    function getVModels(opts) {
        var array = []
        function getVModel(opts, array) {
            var ctrl = opts.controller
            if (avalon.vmodels[ctrl]) {
                avalon.Array.ensure(array, avalon.vmodels[ctrl])
            }
            if (opts.parent) {
                getVModel(opts.parent, array)
            }
        }
        getVModel(opts, array)
        return array
    }
    /*
     * 对 avalon.router.get 进行重新封装
     * state： 指定当前状态名
     * controller： 指定当前所在的VM的名字
     * template: 指定当前模板
     * parent: 父状态对象
     * views: 允许同时处理多个模板
     * abstract:
     */
    avalon.state = function(name, opts) {
        var parent = getParent(name)
        if (parent) {
            opts.url = parent.url + opts.url
            opts.parent = parent
        }

        var vmodes = getVModels(opts)
        var ctrl = vmodes[vmodes.length - 1].$id

        opts.state = name
        var callback = typeof opts.callback === "function" ? opts.callback : avalon.noop
        avalon.router.get(opts.url, function() {
            //  var ctrl = opts.controller
            var that = this, args = arguments

            var views = getViews(ctrl, name)

            if (!opts.views) {
                var node = getNamedView(views, "")
                if (node) {
                    var promise = fromConfig(opts, this.params)
                    if (promise && promise.then) {
                        promise.then(function(s) {
                            avalon.innerHTML(node, s)

                            callback.apply(that, args)
                            avalon.scan(node, getVModels(opts))
                        })
                        return promise
                    }
                }
            }
        }, opts)
        return this
    }
})
