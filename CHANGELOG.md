**v1.5.0** (2022-06-14)
- 支持数据传输加密
- 支持userUniqAppend
- 优化数据停止/暂停上报接口
- 自动采集事件支持自定义属性
- 支持自定义时区
- 支持用户使用时长的统计
- 用户使用时长超长，限制最大24小时

**v1.4.1** (2021-06-24)
- 支持预制属性获取
- 优化上报地址处理逻辑

**v1.4.0** (2020-08-25)
- 支持首次事件, 允许传入自定义的 ID 校验是否首次上报
- 支持可更新、可重写的事件
- 支持 DEBUG 模式，通过后台校验数据格式

**v1.3.0** (2020-02-10)
- 支持 Array 类型
- 新增 userAppend 接口
- 去除本地数据格式校验

**v1.2.3** (2019-12-27)
- 新增一个接口 ta.trackWithBeacon()，需配合数数接收端使用
- 不再支持 beacon 方式作为全局设置，如果设置了 beacon，会降级到 image 方式

**v1.2.2** (2019-12-26)
- 优化 sendBeacon 上报方式，根据函数返回值判断是否要降级 

**v1.2.1** (2019-12-17)
- 支持 beacon 方式上报，浏览器不支持时会降级到 image

**v1.2.0** (2019-10-18)
- 支持重置用户属性
- 事件预置属性新增时间偏移，适配多时区需求

**v1.1.0** (2019-07-19)
- 默认使用 localStorage 缓存 device id, distinct id, account id 等需要持久化的数据
- 支持多实例: 多个实例之间原则上只有 device id 是共享的. 其他的所有属性和配置都不共享.
- 增加接口：
	- getDeviceId()
	- getDistinctId()
	- getPageProperty()
	- setSuperProperties(superProperties)
	- unsetSuperProperty(propertyName)
	- clearSuperProperties()
	- getSuperProperties()
	- setDynamicSuperProperties(function)
	- timeEvent(eventName)
- 增加属性合法性校验逻辑
- 自动采集点击事件优化:
	- 增加 #element_type 属性, 传入 nodeName
	- 增加页面属性，类似于ta_pageview
	- 优化逻辑，去除重复采集
	- 修复 name 属性重置的bug
- 增加 loaded 参数, 可以传入回调函数。当初始化完成时，会回调此函数.
- 增加更多发布版本: umd, amd, esm, cjs, iife
- 其他优化：
	- 修复 device id 未持久化bug
	- 优化初始化逻辑
	- 预置属性增加 #os 采集ua 中的操作系统信息

**v1.0.7** (2019-05-31)
- 修复兼容性Bug.

**v1.0.6** (2019-05-10)
- 支持 identify 接口


