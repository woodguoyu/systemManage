////模型定义
//var modelBaseitem = {
//    className: "样式类名",
//    iconClass: "图标类名",
//    caption: "标题文字",
//    description: "描述说明",
//    index: null, //索引号，用于排序，为空时默认前置
//};
//var modelGroupitem = {
//    //派生自 modelBaseitem
//    name: "分组名称",
//    expanded: null, //展开状态，true or false
//};
//var modelSeperatoritem = {
//    //派生自 modelBaseitem
//    group: "所属分组名称，如无分组必须置空",
//    seperator: true,
//};
//var modelMenuitem = {
//    //派生自 modelBaseitem
//    group: "所属分组名称，如无分组必须置空",
//    action: "行为，如：url、javascript",
//    content: "内容",
//    default: false, //是否默认项，多个默认项只有第一个有效，无默认项默认选择第一个，只能应用于菜单项
//    selected: null, //选择状态，true or false
//    children: [], //子模型集合
//};
////菜单对象，派生自itemBase
//var modelMenuobject = {};

/*数据的获取并加载到导航栏*/
var app = angular.module('iweApp', []);

//页面dom加载完成之后，$on获取ngRepeatFinished事件，再执行自己需要执行的脚本
app.directive('onFinishRenderFilters', function ($timeout) {
    return {
        restrict: 'A',
        link: function (scope, element, attr) {
            if (scope.$last === true) {
                $timeout(function () {
                    scope.$emit('ngRepeatFinished', element);
                });
            }
        }
    };
});
//左侧导航栏指令
app.directive("menuDirective",function(){
	return{
		restrict:"AE",
		replace:true,
		templateUrl:"./template/menu.html",
		scope: {menu: '='},
		link:function(socpe,ele,attr){
			
		}
	}
});
//右侧侧tab页指令
app.directive("tabDirective",function(){
	return{
		restrice:"AE",
		templateUrl:"./template/tab.html",
		scope:{tab:'='}
	}
});
//分组过滤器定义
//参数：name，分组名称
app.filter('group', function () {
    return function (inputArray, name) {
        var array = [];
        $.each(inputArray, function (index, item) {
            if ((name && item.group == name) || (!name && !item.group)) {
                array.push(item);
            }
        });
        return array;
    };
});

//初始化控制器
app.controller('iweCtrl', function ($scope, $http, $timeout) {
    //集成工作环境初始化
    // intergrate work enviroment

    var _commandState = {
        "executing": "executing",
        "executed": "executed",
        "exiting": "exiting",
        "exited": "exited",
        "activating": "activateing",
        "activated": "activated",
        "deactivating": "deactivating",
        "deactivated": "deactivated"
    };

    //菜单处理程序
    var menu = $scope.menu = {
        "current": null,
        "children": [],
        "className": null,
        "iconClass": null,
        "caption": null,
        "description": null,
        "init": function (menuObject) {
            //点击事件处理程序
            var _itemClicked = function (item) {
                item = item || this;
                if(!item.isDispalyed && item.isDispalyed !== undefined){
                    if (menu.current) {
                        menu.current.selected = false;
                    }
                    menu.current = item;
                    menu.current.selected = true;
                    _command(item);
                }else if (item.isGroup) {
                    item.expanded = !item.expanded;
                }
                else if (item.hasChildren) {
                    //子级菜单处理
                    if (!item.selected) {
                        if (menu.current) {
                            menu.current.selected = false;
                        }
                            menu.current = item;
                            menu.current.selected = true;
                    }
                }
                else {
                    //执行命令
                    // if (menu.current) {
                    //     menu.current.selected = false;
                    // }
                    // menu.current = item;
                    // menu.current.selected = true;
                    _command(item);
                }
            };
            //菜单命令执行处理
            var _command = function (item) {
                tab.open({
                    "key": item.id,
                    "data": item,
                    "caption": item.caption,
                    "description": item.description,
                    "className": item.className,
                    "iconClass": item.iconClass,
                    "url": item.content,
                    "setState": function (state) {
                        switch (state) {
                            case _commandState.activated:
                                this.data.selected = true;
                                break;
                            case _commandState.deactivated:
                                this.data.selected = false;
                                break;
                        }
                    }
                });
            };
            //菜单初始化处理
            var _init = function (items, parent) {
                $.each(items, function (index, item) {
                    if (item.seperator = item.seperator && true) {
                        return;
                    }
                    item.clicked = _itemClicked;
                    if (item.isGroup = item.name && $.trim(item.name) != "") {
                        return;
                    }
                    item.hasChildren = item.children && Array.isArray(item.children) && item.children.length > 0;
                    if (!(item.parent = parent)) {
                        item.deep = 0;
                        item.id = "item," + item.deep + "," + (index + 1);
                    }
                    else {
                        item.deep = item.parent.deep + 1;
                        item.id = item.parent.id + "," + item.deep + "," + (index + 1);
                    }
                    if (item.hasChildren) {
                        _init(item.children, item);
                    }
                });
            };
            _init(menuObject.children, null);
            menu.className = menuObject.className || menu.className;
            menu.iconClass = menuObject.iconClass || menu.iconClass;
            menu.caption = menuObject.caption || menu.caption;
            menu.description = menuObject.description || menu.description;
            Array.prototype.push.apply(menu.children, menuObject.children);
        }
    };

    //tab标签处理程序
    var tab = $scope.tab = {
        "current": null,
        "items": [],
        "mapping": [],
        "className": null,
        "iconClass": null,
        "caption": "tabCtrl",
        "description": null,
        "open": function (command) {
            if (!command) {
                return;
            }
            if (!command.key) {
                //生成随机、唯一key
                key = Math.random();
            }
            var _init = function (item) {
                if (!item.command.setState || typeof item.command.setState != "function") {
                    item.command.setState = function (state) { return true; };
                }
                item.setState = function (state) {
                    //设置命令状态
                    this.command.setState(state);
                };
                item.selected = false;
                item.clicked = function () {
                    /*if (tab.current) {
                        tab.current.setState(_commandState.deactivated);
                    }*/
                    $.each(tab.items,function(n,v){
						v.command.setState(_commandState.deactivated);
					});
                    tab.current = this;
                    tab.current.setState(_commandState.activated);
                };
                item.close = function () {
                    var key = this.command.key;
                    delete tab.mapping[key] ;//= null;
                    var itemIndex = -1;
                    for (var i = 0; i < tab.items.length; i++) {
                        if (tab.items[i].command.key == key) {
                            itemIndex = i;
                            break;
                        }
                    }
                    if(itemIndex!==0) {
                        if(tab.items[itemIndex].command.data.selected)
                        {
                            tab.items[itemIndex].command.setState(_commandState.deactivated);
                            tab.items.splice(itemIndex, 1);
                            tab.items[itemIndex - 1].command.setState(_commandState.activated);
                            tab.current = tab.items[itemIndex - 1];
                        }
                        else{
                            tab.items.splice(itemIndex, 1);
                        }
                    }
                };
                return item;
            };
            var item = this.mapping[command.key];
            if (!item) {
                item = _init({ "command": command, "selected": false });
                this.mapping[command.key] = item;
                $.each(tab.items,function(n,v){
					v.command.setState(_commandState.deactivated);
				});
                this.items.push(item);
            }
            item.clicked();
        },
        "init": function (tabObject) {
        }
    };
	$scope.showCloseArea = function(){
		$(".closeTab").slideToggle(300);
	}
	    //关闭操作
	$scope.closeItems = function($event,type){
		switch(type){
			case 0:
				//关闭当前
				tab.current.close();
				break;
			case 1:
				//关闭所有
				if(tab.items && tab.items.length>0){
					if(tab.items!=null && tab.items.length>0){

						tab.items.splice(1,tab.items.length);
						tab.current=tab.items[0];
						for(var key in tab.mapping){
							if(key!=tab.current.command.key){
								delete tab.mapping[key];
							}
						}
                        // tab.current.close();
						$timeout(function(){
							tab.current.clicked();
						});
					}
				}
				break;
			case 2:
				//关闭其他
				if(tab.items && tab.items.length>0){
					tab.items=tab.items.filter(function(x){return x.command.data.default || x.command.data.selected;});
					for(var key in tab.mapping){
							if(key!=tab.current.command.key && key!=tab.items[0].command.key){
								delete tab.mapping[key];
							}
					}
				}
				break;
		}
		$scope.showCloseArea();
	}

    //刷新
    $scope.refresh = function(){
		$(".layui-show").find("iframe").attr('src', $(".layui-show").find("iframe").attr('src'));
	}
    // 点击显示隐藏菜单栏
    $scope.isShowMenu = function(){
        if( $('.icon_lists_show').hasClass("icon_lists_tra")){
            $('.icon_lists_show').removeClass('icon_lists_tra');
            $("#leftnav").css('display','none');
            $("#rightpage").addClass('rightPage_none');
        }else{
            $('.icon_lists_show').addClass("icon_lists_tra");
            $("#leftnav").css('display','block');
            $("#rightpage").removeClass('rightPage_none');
        }
    }

    //列表渲染完成事件处理
    $scope.$on('ngRepeatFinished', function (ngRepeatFinishedEvent, element) {
    	//;
          $timeout(function () {
          	var ele=element.closest("div.firstClick").find("li:first");
          	if(ele!=null){
          		ele.scope().first.clicked();
          	}     	
          });
    });
    
    $http.get("./js/data/new.json").success(function (response) {
        menu.init(response);
    });
});
