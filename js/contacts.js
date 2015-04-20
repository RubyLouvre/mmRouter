define([], function () {
    var lastId
    var vmodel = avalon.define({
        $id: "contacts",
        // $skipArray: ["contact", "item"],
        edit: function() {
            avalon.router.go("contacts.detail.item.edit")
        },
        done: function() {
            avalon.router.go("contacts.detail.item")
        },
        goToRandom: function() {
            var contacts = vmodel.contacts
            var id = NaN
            while (true) {
                var index = Math.floor(Math.random() * contacts.length)
                id = contacts[index].id
                if (id !== lastId)//确保不重复
                    break
            }
            lastId = id
            avalon.router.go("contacts.detail", {contactId: id})
        },
        contacts: [],
        id: NaN,
        contact: {
        },
        item: {}
    })
    vmodel.$watch("id", function(a) {
        vmodel.contact = (vmodel.contacts.filter(function(el) {
            return  el.id == a
        }) || [{}])[0]
    })
    return avalon.controller(function($ctrl) {
        $ctrl.$vmodels = [vmodel]
        // 加载数据
        $ctrl.$onEnter = function(param, rs, rj) {
            // var pro = new Promise(function(rs) {
            //     setTimeout(function() {
            //         rs("faild")
            //     }, 1000)
            // })
            // return pro.then(function() {

            // })
            // return "faild" 
            // avalon.get("./js/list.json", {}, function(res){
                setTimeout(function() {
                    // 这样写似乎更保险
                    rs(function() {
                        // vmodel.contacts = eval("(" + res + ")")
                        vmodel.contacts = [{
                            id: 1,
                            name: "司徒正美",
                            items: [{
                                "id": "a",
                                "type": "phone number",
                                "value": "555-1234-1234"
                            }, {
                                "id": "b",
                                "type": "email",
                                "value": "alice@mailinator.com"
                            }]
                        }, {
                            id: 2,
                            name: "清风火羽",
                            "items": [{
                                "id": "a",
                                "type": "blog",
                                "value": "http://bob.blogger.com"
                            }, {
                                "id": "b",
                                "type": "fax",
                                "value": "555-999-9999"
                            }]
                        }, {
                            id: 3,
                            name: "光明之星",
                            "items": [{
                                "id": "a",
                                "type": "blog",
                                "value": "http://bob.blogger.com"
                            }, {
                                "id": "b",
                                "type": "fax",
                                "value": "111-222-333"
                            }]
                        }, {
                            id: 4,
                            name: "rubylouver",
                            "items": [{
                                "id": "a",
                                "type": "blog",
                                "value": "http://bob.rubylouver.com"
                            }, {
                                "id": "b",
                                "type": "fax",
                                "value": "111-222-333"
                            }]
                        }]
                    })
                }, 1000)
            // }, "text")
            // here will stop
            return false
        }

        // 初始化
        $ctrl.$onRendered = function() {
        }
    })
})