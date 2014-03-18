define(["mmHistory"], function(avalon) {
    if (![].reduce) {
        Array.prototype.reduce = function(fn, lastResult, scope) {
            if (this.length == 0)
                return lastResult;
            var i = lastResult !== undefined ? 0 : 1;
            var result = lastResult !== undefined ? lastResult : this[0];
            for (var n = this.length; i < n; i++)
                result = fn.call(scope, result, this[i], i, this);
            return result;
        }
    }
    //表的结构：method+segments.length 普通字段
    function _tokenize(pathStr) {
        var stack = [''];
        for (var i = 0; i < pathStr.length; i++) {
            var chr = pathStr.charAt(i);
            if (chr === '/') {//用于让后面的字符串相加
                stack.push('');
                continue;
            } else if (chr === '(') {
                stack.push('(');
                stack.push('');
            } else if (chr === ')') {
                stack.push(')');
                stack.push('');
            } else {
                stack[stack.length - 1] += chr;
            }
        }
        return stack.filter(function(str) {
            return str.length !== 0;// 去掉空字符
        });
    }



    function _parse(tokens) {
        var smallAst = [];
        var token;
        while ((token = tokens.shift()) !== void 0) {
            if (token.length <= 0) {
                continue;
            }
            switch (token) {
                case '(':
                    smallAst.push(_parse(tokens));
                    break;
                case ')':
                    return smallAst;
                default:
                    smallAst.push(token);
            }
        }
        return smallAst;
    }
    var combine = function(list, func) {
        var first = list.shift();
        var second = list.shift();
        if (second === void 0) {
            return first;
        }
        var combination = first.map(function(val1) {
            return second.map(function(val2) {
                return func(val1, val2);
            });
        }).reduce(function(val1, val2) {
            return val1.concat(val2);
        });
        if (list.length === 0) {
            return combination;
        } else {
            return combine([combination].concat(list), func);
        }
    }
    // 将一个路由规则转换为一个数组
    // "/users/:user/apps/:app/:id"   -->   ["users",":user","apps",":app",":id"]
    // "/items/:item(/type/:type)"   --> ["items", ":item", ["type", ":type"] ]
    function parse(rule) {
        var tokens = _tokenize(rule);

        var ast = _parse(tokens);

        return ast;
    }

    function Router() {
        this.routingTable = {};
    }
    function parseQuery(path) {
        var array = path.split("#"), query = {}, tail = array[1];
        if(array.length==1 && array[0].indexOf('?')>-1){
            tail = array[0], array[0] = array[0].split('?')[0];
        }
        if (tail) {
            var index = tail.indexOf("?");
            if (index > 0) {
                var seg = tail.slice(index + 1).split('&'),
                        len = seg.length, i = 0, s;
                for (; i < len; i++) {
                    if (!seg[i]) {
                        continue;
                    }
                    s = seg[i].split('=');
                    query[decodeURIComponent(s[0])] = decodeURIComponent(s[1]);
                }
            }
        }
        return {
            pathname: array[0],
            query: query
        };
    }

    Router.prototype = {
        _set: function(table, query, value) {
            var nextKey = query.shift();//构建一个前缀树，用于高速匹对给定的URL
            if (nextKey.length <= 0) {
                avalon.error('构建失败');
            }
            if (nextKey.charAt && nextKey.charAt(0) === ':') {//如果碰到参数
                var n = nextKey.substring(1);
                if (table.hasOwnProperty('^n') && table['^n'] !== n) {
                    return false;
                }
                table['^n'] = n;
                nextKey = '^v';
            }
            if (query.length === 0) {
                table[nextKey] = value;
                return true;
            } else {
                var nextTable = table.hasOwnProperty(nextKey) ?
                        table[nextKey] : table[nextKey] = {};
                return this._set(nextTable, query, value);
            }

        },
        error: function(callback) {
            this.errorback = callback
        },
        //添加一个路由规则
        add: function(method, path, value) {

            var ast = parse(path); //转换为抽象语法树

            var patterns = this._expandRules(ast);//进行全排列，应对可选的fragment

            if (patterns.length === 0) {
                var query = [method, 0];
                this._set(this.routingTable, query, value);
            } else {
                var self = this
                patterns.every(function(pattern) {
                    var length = pattern.length,
                            query = [method, length].concat(pattern);
                    return self._set(self.routingTable, query, value);
                });
            }
            return value;
        },
        routeWithQuery: function(method, path) {
            var parsedUrl = parseQuery(path),
                    ret = this.route(method, parsedUrl.pathname);
            if (ret) {
                ret.query = parsedUrl.query;
                return ret;
            }
        },
        route: function(method, path) {//将当前URL与
            path = path.trim();
            var splitted = path.split('/'),
                    query = Array(splitted.length),
                    index = 0,
                    params = {},
                    table = [],
                    args = [],
                    val, key, j;
            for (var i = 0; i < splitted.length; ++i) {
                val = splitted[i];
                if (val.length !== 0) {
                    query[index] = val;
                    index++;
                }
            }
            query.length = index;
            table = this.routingTable[method];
            if (table === void 0)
                return;
            table = table[query.length];
            if (table === void 0)
                return;
            for (j = 0; j < query.length; ++j) {
                key = query[j];
                if (table.hasOwnProperty(key)) {
                    table = table[key];
                } else if (table.hasOwnProperty('^v')) {
                    params[table['^n']] = key;
                    args.push(key)
                    table = table['^v'];
                } else {
                    return;
                }
            }
            return {
                query: {},
                path: path,
                args: args,
                params: params,
                value: table
            };
        },
        getLatelyPath: function() {
            return getCookie("msLatelyPath")
        },
        setLatelyPath: function(path) {
            setCookie("msLatelyPath", path)
        },
        _expandRules: function(ast) {
            if (Array.isArray(ast) && ast.length === 0) {
                return [];
            }
            var self = this;
            var result = combine(ast.map(function(val) {
                if (typeof val === 'string') {
                    return [[val]];
                } else if (Array.isArray(val)) {
                    return self._expandRules(val).concat([[]]);
                } else {
                    throw new Error('这里的值只能是字符串或数组 {{' + val + '}}');
                }
            }), function(a, b) {
                return a.concat(b);
            });
            return result;
        },
        navigate: function(url) {//传入一个URL，触发预定义的回调
            var match = this.routeWithQuery("GET", url);
            if (match) {
                var fn = match.value;
                if (typeof fn === "function") {
                    return  fn.apply(match, match.args);
                }
            } else if (typeof this.errorback === "function") {
                this.errorback(url)
            }
        }
    };
    "get,put,delete,post".replace(avalon.rword, function(method) {
        return  Router.prototype[method] = function(path, fn) {
            return this.add(method.toUpperCase(), path, fn)
        }
    })
    function supportLocalStorage() {
        try {
            return 'localStorage' in window && window['localStorage'] !== null;
        } catch (e) {
            return false;
        }
    }
    if (supportLocalStorage()) {
        Router.prototype.getLatelyPath = function() {
            return localStorage.getItem("msLatelyPath")
        }
        Router.prototype.setLatelyPath = function(path) {
            localStorage.setItem("msLatelyPath", path)
        }
    }

    function escapeCookie(value) {
        return String(value).replace(/[,;"\\=\s%]/g, function(character) {
            return encodeURIComponent(character);
        });
    }
    function setCookie(key, value) {
        var date = new Date();//将date设置为10天以后的时间 
        date.setTime(date.getTime() + 60 * 60 * 24);
        document.cookie = escapeCookie(key) + '=' + escapeCookie(value) + ";expires=" + date.toGMTString()
    }
    function getCookie(name) {
        var result = {};
        if (document.cookie !== '') {
            var cookies = document.cookie.split('; ')
            for (var i = 0, l = cookies.length; i < l; i++) {
                var item = cookies[i].split('=');
                result[decodeURIComponent(item[0])] = decodeURIComponent(item[1]);
            }
        }
        return name ? result[name] : result
    }

    avalon.router = new Router
    // 先添加路由规则与对应的处理函数
    // router.add("GET","/aaa", function(){}) //{GET:{1:{aaa: function(){}}}}
    // router.add("GET","/aaa/bbb", function(){}) //{GET:{1:{aaa:{bbb: function(){}} }}}
    // router.add("GET","/aaa/:bbb", function(){}) //{GET:{1:{aaa: {"^n": "bbb", "^v": function(){}}}}}
    // router.add("GET","/aaa(/:bbb)", function(){}) //{GET:{1:{aaa: {"^n": "bbb", "^v": function(){}}}}}
    // 再启动历史管理器
    // require("ready!", function(avalon){
    //     avalon.history.start();
    // })


    return avalon
})
// http://kieran.github.io/barista/
// https://github.com/millermedeiros/crossroads.js/wiki/Examples
