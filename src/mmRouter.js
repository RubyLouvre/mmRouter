/*
 * 
 * version 1.0
 * built in 2015.11.19
 */

var mmHistory = require('./mmHistory')
var storage = require('./storage')


function Router() {
    var table = {}
    "get,post,delete,put".replace(avalon.rword, function (name) {
        table[name] = []
    })
    this.routingTable = table
}


Router.prototype = storage

avalon.mix(storage, {
    //当地址栏无法匹配任何已定义的路由规则时就会执行这个回调
    error: function (callback) {
        this.errorback = callback
    },
    //添加一个路由规则
    add: function (method, path, callback, opts) {
        var array = this.routingTable[method.toLowerCase()]
        if (path.charAt(0) !== "/") {
            throw "path必须以/开头"
        }
        opts = opts || {}
        opts.callback = callback
        if (path.length > 2 && path.charAt(path.length - 1) === "/") {
            path = path.slice(0, -1)
            opts.last = "/"
        }
        avalon.Array.ensure(array, this._pathToRegExp(path, opts))
    },
    //判定当前URL与已有状态对象的路由规则是否符合
    route: function (method, path, query) {
        path = path.trim()
        var states = this.routingTable[method]
        for (var i = 0, el; el = states[i++]; ) {
            var args = path.match(el.regexp)
            if (args) {
                el.query = query || {}
                el.path = path
                el.params = {}
                var keys = el.keys
                args.shift()
                if (keys.length) {
                    parseArgs(args, el)
                }
                return  el.callback.apply(el, args)
            }
        }
        if (this.errorback) {
            this.errorback()
        }
    },
    /*
     *  @interface avalon.router.redirect
     *  @param hash 访问的url hash
     */
    redirect: function (hash) {
        this.navigate(hash, {replace: true})
    },
    /*
     *  @interface avalon.router.navigate
     *  @param hash 访问的url hash
     *  @param options 扩展配置
     *  @param options.replace true替换history，否则生成一条新的历史记录
     *  @param options.silent true表示只同步url，不触发url变化监听绑定
     */
    navigate: function (hash, options) {
//        var parsed = parseQuery((hash.charAt(0) !== "/" ? "/" : "") + hash),
//                options = options || {}
//        if (hash.charAt(0) === "/")
//            hash = hash.slice(1)// 修正出现多扛的情况 fix http://localhost:8383/index.html#!//
//        // 在state之内有写history的逻辑
//        avalon.history && avalon.history.navigate(hash, false)
//        // 只是写历史而已
//        if (!options.silent && this.lastHash !== hash) {
//            this.lastHash = hash
//            this.route("get", parsed.path, parsed.query, options)
//        }
    },
    /*
     *  @interface avalon.router.when 配置重定向规则
     *  @param path 被重定向的表达式，可以是字符串或者数组
     *  @param redirect 重定向的表示式或者url
     */
    when: function (path, redirect) {
        var me = this,
                path = path instanceof Array ? path : [path]
        avalon.each(path, function (index, p) {
            me.add("get", p, function () {
                var info = me.urlFormate(redirect, this.params, this.query)
                me.navigate(info.path + info.query, {replace: true})
            })
        })
        return this
    },
    /*
     *  @interface avalon.router.get 添加一个router规则
     *  @param path url表达式
     *  @param callback 对应这个url的回调
     */
    get: function (path, callback) {
    },
    urlFormate: function (url, params, query) {
        var query = query ? queryToString(query) : "",
                hash = url.replace(placeholder, function (mat) {
                    var key = mat.replace(/[\{\}]/g, '').split(":")
                    key = key[0] ? key[0] : key[1]
                    return params[key] !== undefined ? params[key] : ''
                }).replace(/^\//g, '')
        return {
            path: hash,
            query: query
        }
    },
    _pathToRegExp: function (pattern, opts) {
        var keys = opts.keys = [],
                //      segments = opts.segments = [],
                compiled = '^', last = 0, m, name, regexp, segment;

        while ((m = placeholder.exec(pattern))) {
            name = m[2] || m[3]; // IE[78] returns '' for unmatched groups instead of null
            regexp = m[4] || (m[1] == '*' ? '.*' : 'string')
            segment = pattern.substring(last, m.index);
            var type = this.$types[regexp]
            var key = {
                name: name
            }
            if (type) {
                regexp = type.pattern
                key.decode = type.decode
            }
            keys.push(key)
            compiled += quoteRegExp(segment, regexp, false)
            //  segments.push(segment)
            last = placeholder.lastIndex
        }
        segment = pattern.substring(last);
        compiled += quoteRegExp(segment) + (opts.strict ? opts.last : "\/?") + '$';
        var sensitive = typeof opts.caseInsensitive === "boolean" ? opts.caseInsensitive : true
        //  segments.push(segment);
        opts.regexp = new RegExp(compiled, sensitive ? 'i' : undefined);
        return opts

    },
    /* *
     `'/hello/'` - 匹配'/hello/'或'/hello'
     `'/user/:id'` - 匹配 '/user/bob' 或 '/user/1234!!!' 或 '/user/' 但不匹配 '/user' 与 '/user/bob/details'
     `'/user/{id}'` - 同上
     `'/user/{id:[^/]*}'` - 同上
     `'/user/{id:[0-9a-fA-F]{1,8}}'` - 要求ID匹配/[0-9a-fA-F]{1,8}/这个子正则
     `'/files/{path:.*}'` - Matches any URL starting with '/files/' and captures the rest of the
     path into the parameter 'path'.
     `'/files/*path'` - ditto.
     */
    // avalon.router.get("/ddd/:dddID/",callback)
    // avalon.router.get("/ddd/{dddID}/",callback)
    // avalon.router.get("/ddd/{dddID:[0-9]{4}}/",callback)
    // avalon.router.get("/ddd/{dddID:int}/",callback)
    // 我们甚至可以在这里添加新的类型，avalon.router.$type.d4 = { pattern: '[0-9]{4}', decode: Number}
    // avalon.router.get("/ddd/{dddID:d4}/",callback)
    $types: {
        date: {
            pattern: "[0-9]{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[1-2][0-9]|3[0-1])",
            decode: function (val) {
                return new Date(val.replace(/\-/g, "/"))
            }
        },
        string: {
            pattern: "[^\\/]*",
            decode: function (val) {
                return val;
            }
        },
        bool: {
            decode: function (val) {
                return parseInt(val, 10) === 0 ? false : true;
            },
            pattern: "0|1"
        },
        'int': {
            decode: function (val) {
                return parseInt(val, 10);
            },
            pattern: "\\d+"
        }
    }
})










function parseQuery(url) {
    var array = url.split("?"), query = {}, path = array[0], querystring = array[1]
    if (querystring) {
        var seg = querystring.split("&"),
                len = seg.length, i = 0, s;
        for (; i < len; i++) {
            if (!seg[i]) {
                continue
            }
            s = seg[i].split("=")
            query[decodeURIComponent(s[0])] = decodeURIComponent(s[1])
        }
    }
    return {
        path: path,
        query: query
    }
}


function queryToString(obj) {
    if (typeof obj == 'string')
        return obj
    var str = []
    for (var i in obj) {
        if (i == "query")
            continue
        str.push(i + '=' + encodeURIComponent(obj[i]))
    }
    return str.length ? '?' + str.join("&") : ''
}




var placeholder = /([:*])(\w+)|\{(\w+)(?:\:((?:[^{}\\]+|\\.|\{(?:[^{}\\]+|\\.)*\})+))?\}/g



"get,put,delete,post".replace(avalon.rword, function (method) {
    return storage[method] = function (a, b, c) {
        this.add(method, a, b, c)
    }
})
function quoteRegExp(string, pattern, isOptional) {
    var result = string.replace(/[\\\[\]\^$*+?.()|{}]/g, "\\$&");
    if (!pattern)
        return result;
    var flag = isOptional ? '?' : '';
    return result + flag + '(' + pattern + ')' + flag;
}



function parseArgs(match, stateObj) {
    var keys = stateObj.keys
    for (var j = 0, jn = keys.length; j < jn; j++) {
        var key = keys[j]
        var value = match[j] || ""
        if (typeof key.decode === "function") {//在这里尝试转换参数的类型
            var val = key.decode(value)
        } else {
            try {
                val = JSON.parse(value)
            } catch (e) {
                val = value
            }
        }
        match[j] = stateObj.params[key.name] = val
    }
}


module.exports = avalon.router = new Router

