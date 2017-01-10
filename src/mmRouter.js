/*
 * 
 * version 1.0
 * built in 2015.11.19
 * 
 * v0.9.6
 * 修正gasAttribute typo
 * 修正mmHistory document.write BUG
 * 
 * 
 */

var mmHistory = require('./mmHistory')
var storage = require('./storage')

function Router() {
    this.rules = []
}


var placeholder = /([:*])(\w+)|\{(\w+)(?:\:((?:[^{}\\]+|\\.|\{(?:[^{}\\]+|\\.)*\})+))?\}/g
Router.prototype = storage
avalon.mix(storage, {
    error: function (callback) {
        this.errorback = callback
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
    //添加一个路由规则
    add: function (path, callback, opts) {
        var array = this.rules
        if (path.charAt(0) !== "/") {
            avalon.error("avalon.router.add的第一个参数必须以/开头")
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
    route: function (path, query) {
        path = path.trim()
        var rules = this.rules
        for (var i = 0, el; el = rules[i++]; ) {
            var args = path.match(el.regexp)
            if (args) {
                el.query = query || {}
                el.path = path
                el.params = {}
                var keys = el.keys
                args.shift()
                if (keys.length) {
                    this._parseArgs(args, el)
                }
                return  el.callback.apply(el, args)
            }
        }
        if (this.errorback) {
            this.errorback()
        }
    },
    _parseArgs: function (match, stateObj) {
        var keys = stateObj.keys
        for (var j = 0, jn = keys.length; j < jn; j++) {
            var key = keys[j]
            var value = match[j] || ''
            if (typeof key.decode === 'function') {//在这里尝试转换参数的类型
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
    },
    /*
     *  @interface avalon.router.navigate 设置历史(改变URL)
     *  @param hash 访问的url hash   
     */
    navigate: function (hash, mode) {
        var parsed = parseQuery(hash)
        var newHash = this.route(parsed.path, parsed.query)
        if(isLegalPath(newHash)){
            hash = newHash
        }
        //保存到本地储存或cookie
        avalon.router.setLastPath(hash)
        // 模式0, 不改变URL, 不产生历史实体, 执行回调
        // 模式1, 改变URL, 不产生历史实体,   执行回调
        // 模式2, 改变URL, 产生历史实体,    执行回调
        if (mode === 1) {
          
            avalon.history.setHash(hash, true)
        } else if (mode === 2) {
            avalon.history.setHash(hash)
        }
        return hash
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
            me.add(p, function () {
                var info = me.urlFormate(redirect, this.params, this.query)
                me.navigate(info.path + info.query)
            })
        })
        return this
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


module.exports = avalon.router = new Router


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
function isLegalPath(path){
    if(path === '/')
        return true
    if(typeof path === 'string' && path.length > 1 && path.charAt(0) === '/'){
        return true
    }
}

function queryToString(obj) {
    if (typeof obj === 'string')
        return obj
    var str = []
    for (var i in obj) {
        if (i === "query")
            continue
        str.push(i + '=' + encodeURIComponent(obj[i]))
    }
    return str.length ? '?' + str.join("&") : ''
}


function quoteRegExp(string, pattern, isOptional) {
    var result = string.replace(/[\\\[\]\^$*+?.()|{}]/g, "\\$&");
    if (!pattern)
        return result;
    var flag = isOptional ? '?' : '';
    return result + flag + '(' + pattern + ')' + flag;
}
