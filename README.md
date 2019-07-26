## ThinkingData JavaScript Library

JavaScript LIB 是数数科技提供给客户, 用于采集 web 页面的用户行为数据的 SDK.

### 使用手册

ThinkingData 用户手册: 数据接入>接入指南>客户端SDK>JavaScript SDK 使用指南
```
https://www.thinkingdata.cn/manual.html
```

### 部分功能使用说明

#### 公共属性
公共属性有三种类型，需要注意区分:
- 页面公共属性: 针对当前页面生效，优先级最高. 如果重新初始化 SDK，页面公共属性会被清空.
- 动态公共属性: 针对当前页面生效，优先级次于页面公共属性。重新初始化SDK后，需要再次设置动态公共属性.
- 公共属性: 开启缓存的情况下，会缓存在 localStorage 或 cookie 中，对所有页面生效. 优先级最低.

#### 多实例

通过调用 initInstance 方法，可以创建子实例对象. 其参数为子实例名称。之后您可以通过该名称调用子实例的接口.
```
// 创建一个名字为 newInstance 的实例
ta.initInstance('newInstance');

// 为子实例设置 distinct_id 并发送 test_event 的事件
ta.newInstance.identify('new_distinct_id');
ta.newInstance.track('test_event');
```

默认情况下，子实例与主实例采用相同的配置(appId, serverUrl等)。并且默认情况下，子实例不会开启本地缓存。
如果需要为子实例单独配置参数，可以在初始化时传入配置信息:
```
var param = {
  appId: 'debug-appid',
  serverUrl: 'ANOTHER_SERVER_URL',
  persistenceEnabled: true, // 开启子实例的本地缓存，子实例本地缓存根据子实例名称 name 区分
}

ta.initInstance('anotherInstance', param);
```

#### 异步载入
使用代码片段载入为异步载入，因此有返回值的方法有可能调用不成功。我们在初始化参数中提供了loaded 属性，可用来设置回调函数。
```js
<!--Thinking Analytics SDK BEGIN-->
<script>
    !function (e) { if (!window.ThinkingDataAnalyticalTool) { var n = e.sdkUrl, t = e.name, r = window, a = document, i = "script", l = null, s = null; r.ThinkingDataAnalyticalTool = t; var o = ["track", "quick", "login", "identify", "logout", "trackLink", "userSet", "userSetOnce", "userAdd", "userDel", "setPageProperty", "setSuperProperties", "setDynamicSuperProperties", "clearSuperProperties", "timeEvent", "unsetSuperProperties", "initInstance"]; r[t] = function (e) { return function () { if (this.name) (r[t]._q = r[t]._q || []).push([e, arguments, this.name]); else if ("initInstance" === e) { var n = arguments[0]; r[t][n] = { name: n }; for (var a = 0; a < o.length; a++)r[t][n][o[a]] = r[t].call(r[t][n], o[a]); (r[t]._q1 = r[t]._q1 || []).push([e, arguments]) } else (r[t]._q = r[t]._q || []).push([e, arguments]) } }; for (var u = 0; u < o.length; u++)r[t][o[u]] = r[t].call(null, o[u]); r[t].param = e, r[t].__SV = 1.1, l = a.createElement(i), s = a.getElementsByTagName(i)[0], l.async = 1, l.src = n, s.parentNode.insertBefore(l, s) } }(
    {

        appId: "YOUR APP ID",
        name: "ta",
        sdkUrl: "./thinkingdata.min.js",
        serverUrl: "RECEIVER SERVER URL",
        loaded: function(ta) {
            var currentId = ta.getDistinctId();
            ta.identify(currentId + '_1');
            ta.quick('autoTrack');
        }
    });
</script>
<!--Thinking Analytics SDK END-->
```

在初始化完成之前，所有的调用将被缓存。初始化阶段，将按照如下顺序执行：
1. 创建主实例, 并完成初始化
2. 执行所有缓存的子实例创建
3. 调用 loaded 参数指明的回调函数
4. 按照调用顺序执行之前缓存的方法（包括主实例和子实例）

因此，在上面的代码片段中，loaded 指明的方法将在所有其他方法之前执行.

