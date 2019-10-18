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


