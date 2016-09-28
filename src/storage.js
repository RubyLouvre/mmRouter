
function supportLocalStorage() {
    try {//看是否支持localStorage
        localStorage.setItem("avalon", 1)
        localStorage.removeItem("avalon")
        return true
    } catch (e) {
        return false
    }
}
function escapeCookie(value) {
    return String(value).replace(/[,;"\\=\s%]/g, function (character) {
        return encodeURIComponent(character)
    });
}
var ret = {}
if (supportLocalStorage()) {
    ret.getLastPath = function () {
        return localStorage.getItem('msLastPath')
    }
    var cookieID
    ret.setLastPath = function (path) {
        if (cookieID) {
            clearTimeout(cookieID)
            cookieID = null
        }
        localStorage.setItem("msLastPath", path)
        cookieID = setTimeout(function () {//模拟过期时间
            localStorage.removItem("msLastPath")
        }, 1000 * 60 * 60 * 24)
    }
} else {

    ret.getLastPath = function () {
        return getCookie.getItem('msLastPath')
    }
    ret.setLastPath = function (path) {
        setCookie('msLastPath', path)
    }
    function setCookie(key, value) {
        var date = new Date()//将date设置为1天以后的时间 
        date.setTime(date.getTime() + 1000 * 60 * 60 * 24)
        document.cookie = escapeCookie(key) + '=' + escapeCookie(value) + ';expires=' + date.toGMTString()
    }
    function getCookie(name) {
        var m = String(document.cookie).match(new RegExp('(?:^| )' + name + '(?:(?:=([^;]*))|;|$)')) || ["", ""]
        return decodeURIComponent(m[1])
    }
}

module.exports = ret