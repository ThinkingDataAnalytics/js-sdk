import './json2';
import {
    _,
    Log,
    slice,
} from './utils';
import {
    PropertyChecker
} from './PropertyChecker';

// eslint-disable-next-line no-unused-vars
import Config from './config';
// import pageStayInit from './page_stay';

/** @const */
var MASTER_INSTANCE_NAME = 'thinkingdata';

/** @const */
var DEFAULT_CONFIG = {
    _name: MASTER_INSTANCE_NAME, // instance name for internal use. don't override this property.
    appId: '',
    // eslint-disable-next-line camelcase
    send_method: 'image', // image or ajax or beacon
    persistence: 'localStorage', // localStorage or cookie.
    persistencePrefix: 'ThinkingDataJSSDK',
    persistenceEnabled: true,
    crossSubDomain: true,
    maxReferrerStringLength: 200,
    showLog: true,
    dataSendTimeout: 3000,
    useAppTrack: false,
    strict: false, // invalid data will be post to server by default.
    tryCount: 3,
};

/**
 * constructor of Persistence instance. cookie or localStorage will be used for cache user data.
 * @param {object} param the config of the persistence instance.
 */
var ThinkingDataPersistence = function (param) {
    this['_state'] = {};
    this.crossSubDomain = param['crossSubDomain'];
    this.enabled = param['persistenceEnabled'];

    var oldCookie = null;
    if (this.enabled) {
        // get the persistence name
        if (param['crossSubDomain'] === false) {
            var sub = _.url('sub', location.href);
            if (typeof sub === 'string' && sub !== '') {
                this.name = param['persistencePrefix'] + '_' + sub;
            } else {
                this.name = param['persistencePrefix'] + '_root';
            }
        } else {
            this.name = param['persistencePrefix'] + '_cross';
        }

        var storageType = param['persistence'];
        if (storageType !== 'cookie' && storageType !== 'localStorage') {
            Log.i('Unknown persistence type ' + storageType + '; falling back to cookie');
            storageType = param['persistence'] = 'cookie';
        }
        if (storageType === 'localStorage' && _.localStorage.isSupported()) {
            this.storage = _.localStorage;
            oldCookie = _.cookie.get(this.name);
            if (oldCookie) {
                _.cookie.remove(this.name, this.crossSubDomain);
            }
        } else {
            Log.i('localStorage is not support by the browser; falling back to cookie');
            this.storage = _.cookie;
        }
    }

    this._load(oldCookie);
    if (!this.getDistinctId()) {
        var uuid = param.uuid ? param.uuid : _.UUID();
        this._setDeviceId(uuid);
        this.setDistinctId(uuid);
    }
};

ThinkingDataPersistence.prototype._load = function (oldCookie) {
    if (!this.enabled) return;
    var entry;
    if (oldCookie !== null) {
        entry = oldCookie;
    } else {
        entry = this.storage.get(this.name);
    }

    if (entry !== null && _.check.isJSONString(entry)) {
        this._state = _.extend({}, JSON.parse(entry));
    }

    if (oldCookie !== null) {
        this._save();
    }
};

ThinkingDataPersistence.prototype.getDistinctId = function () {
    return this._state.distinct_id;
};

ThinkingDataPersistence.prototype.setDistinctId = function (distinctId) {
    this._set('distinct_id', distinctId);
};

ThinkingDataPersistence.prototype.setEnableTracking = function (enabled) {
    this._set('enable_tracking', enabled);
};

ThinkingDataPersistence.prototype.getEnableTracking = function () {
    return _.check.isUndefined(this._state.enable_tracking) ? true : this._state.enable_tracking;
};

ThinkingDataPersistence.prototype.clear = function () {
    this._state = {};
    this._save();
};

ThinkingDataPersistence.prototype.setOptTracking = function (optTracking) {
    this._set('opt_tracking', optTracking);
};

ThinkingDataPersistence.prototype.getOptTracking = function () {
    return _.check.isUndefined(this._state.opt_tracking) ? true : this._state.opt_tracking;
};

ThinkingDataPersistence.prototype.setDistinctId = function (distinctId) {
    this._set('distinct_id', distinctId);
};

ThinkingDataPersistence.prototype.getAccountId = function () {
    return this._state.account_id;
};

ThinkingDataPersistence.prototype.setAccountId = function (accountId) {
    this._set('account_id', accountId);
};

ThinkingDataPersistence.prototype.getDeviceId = function () {
    return this._state.device_id;
};

ThinkingDataPersistence.prototype.setSuperProperties = function (superProperties) {
    this._set('super_properties', superProperties);
};

ThinkingDataPersistence.prototype.getSuperProperties = function () {
    return this._state.super_properties || {};
};

ThinkingDataPersistence.prototype.setEventTimer = function (eventName, timestamp) {
    var timers = this._state.event_timers || {};
    timers[eventName] = timestamp;
    this._set('event_timers', timers);
};

ThinkingDataPersistence.prototype.clearEventTimer = function () {
    this._set('event_timers', {});
};

ThinkingDataPersistence.prototype.removeEventTimer = function (eventName) {
    var timers = this._state.event_timers || {};
    var timestamp = timers[eventName];
    if (!_.check.isUndefined(timestamp)) {
        delete this._state.event_timers[eventName];
        this._save();
    }
    return timestamp;
};

ThinkingDataPersistence.prototype._setDeviceId = function (uuid) {
    if (this._state.device_id) {
        Log.w('Current device_id is ', this.getDeviceId(), ', it couldn\'t been set to: ', uuid);
        return;
    }
    this._set('device_id', uuid);
};

ThinkingDataPersistence.prototype._save = function () {
    if (this.enabled) {
        this.storage.set(this.name, JSON.stringify(this._state), 73000, this.crossSubDomain);
    }
};

ThinkingDataPersistence.prototype._set = function (name, value) {
    this._state = this._state || {};
    this._state[name] = value;
    this._save();
};

// Constructor of the lib.
var ThinkingDataAnalyticsLib = function () { };

/**
 * 自动上传页面元素的点击事件.
 * @param dom 需要自动采集点击事件的元素的规则，详见使用文档
 * @param evenName 点击事件的 event name
 * @param eventProperties 点击事件的属性
 */
ThinkingDataAnalyticsLib.prototype.trackLink = function (dom, eventName, eventProperties) {
    if (!this._isCollectData()) {
        return;
    }
    let strict = this._getConfig('strict');
    if (!PropertyChecker.properties(eventProperties) && strict) {
        Log.w('trackLink failed due to invalid properties.');
        return;
    }

    if (dom && _.check.isObject(dom)) {
        let elements = [];
        _.each(dom, (value, key) => {
            if (value && _.check.isArray(value)) {
                _.each(value, (typeName) => {
                    switch (key) {
                        case 'tag':
                            _.each(document.getElementsByTagName(typeName), (element) => {
                                if (elements.indexOf(element) < 0) {
                                    elements.push(element);
                                }
                            });
                            break;
                        case 'class':
                            _.each(document.getElementsByClassName(typeName), (element) => {
                                if (elements.indexOf(element) < 0) {
                                    elements.push(element);
                                }
                            });
                            break;
                        case 'id':
                            var element = document.getElementById(typeName);
                            if (element !== null && elements.indexOf(element) < 0) {
                                elements.push(element);
                            }
                            break;
                    }
                });
            }
        });

        _.each(elements, (element) => {
            if (element !== null) {
                var properties = _.extend({}, _.info.pageProperties(), eventProperties);
                properties['#element_type'] = element.nodeName.toLowerCase();
                if (_.check.isUndefined(properties['name'])) {
                    properties['name'] = element.getAttribute('td-name') || element.innerHTML || element.value || '未获取标识';
                }
                element.addEventListener('click', () => {
                    this._sendRequest({
                        type: 'track',
                        event: eventName,
                        properties: strict ? PropertyChecker.stripProperties(properties) : properties,
                    });
                });
            }
        });
    }
};

ThinkingDataAnalyticsLib.prototype.setPageProperty = function (obj) {
    if (!this._isCollectData()) {
        return;
    }
    if (PropertyChecker.properties(obj) || !this._getConfig('strict')) {
        _.extend(this.currentProps, obj);
    } else {
        Log.w('PageProperty 输入的参数有误');
    }
};

ThinkingDataAnalyticsLib.prototype.getPageProperty = function () {
    return this.currentProps;
};

ThinkingDataAnalyticsLib.prototype.getPresetProperties = function () {
    var properties = _.info.properties();
    var presetProperties = {};
    presetProperties.os = properties['#os'];
    presetProperties.screenWidth = properties['#screen_width'];
    presetProperties.screenHeight = properties['#screen_height'];
    presetProperties.browser = properties['#browser'];
    presetProperties.browserVersion = properties['#browser_version'];
    presetProperties.deviceId = this.getDeviceId();
    let zoneOffset = 0 - (new Date().getTimezoneOffset() / 60.0);
    if (this._getConfig('zoneOffset')) {
        zoneOffset = this._getConfig('zoneOffset');
    }
    presetProperties.zoneOffset = zoneOffset;
    presetProperties.toEventPresetProperties = function () {
        return {
            '#os': presetProperties.os,
            '#screen_width': presetProperties.screenWidth,
            '#screen_height': presetProperties.screenHeight,
            '#browser': presetProperties.browser,
            '#browser_version': presetProperties.browserVersion,
            '#device_id': presetProperties.deviceId,
            '#zone_offset': presetProperties.zoneOffset
        };
    };
    return presetProperties;
};


/**
 * 设置账号ID. 注意：此方法不会上报登录事件
 * @param accountId 账号 ID
 */
ThinkingDataAnalyticsLib.prototype.login = function (accountId) {
    if (!this._isCollectData()) {
        return;
    }
    if (typeof accountId === 'number') {
        accountId = String(accountId);
    }
    if (PropertyChecker.userId(accountId) || !this._getConfig('strict')) {
        var currentAccountId = this['persistence'].getAccountId();
        if (accountId !== currentAccountId) {
            this['persistence'].setAccountId(accountId);
        }
    } else {
        Log.e('login 的参数必须是字符串');
    }
};

/**
 * 清除账号 ID. 注意：此方法不会上报登出事件
 * @param isChangeId 是否重置 distinct ID.
 */
ThinkingDataAnalyticsLib.prototype.logout = function (isChangeId) {
    if (!this._isCollectData()) {
        return;
    }
    if (isChangeId === true) {
        var distinctId = _.UUID();
        this['persistence'].setDistinctId(distinctId);
    }
    this['persistence'].setAccountId('');
};

/**
 * 设置用户属性. 如果属性已经存在，用本次属性值覆盖之前属性.
 */
ThinkingDataAnalyticsLib.prototype.userSet = function (userProperties, callback) {
    if (!this._isCollectData()) {
        return;
    }
    if (PropertyChecker.propertiesMust(userProperties) || !this._getConfig('strict')) {
        this._sendRequest({
            type: 'user_set',
            properties: userProperties
        }, callback);
    }
};

/**
 * 设置用户属性，如果属性已经存在，则丢弃本次数据.
 */
ThinkingDataAnalyticsLib.prototype.userSetOnce = function (userProperties, callback) {
    if (!this._isCollectData()) {
        return;
    }
    if (PropertyChecker.propertiesMust(userProperties) || !this._getConfig('strict')) {
        this._sendRequest({
            type: 'user_setOnce',
            properties: userProperties
        }, callback);
    }
};

/**
 * 重置用户属性.
 */
ThinkingDataAnalyticsLib.prototype.userUnset = function (property, callback) {
    if (!this._isCollectData()) {
        return;
    }
    if (PropertyChecker.propertyName(property) || !this._getConfig('strict')) {
        var properties = {};
        properties[property] = 0;
        this._sendRequest({
            type: 'user_unset',
            properties,
        }, callback);
    }
};

/**
 * 对用户属性进行累加. 属性值只允许为 Number 类型.
 * @param userProperties 如果为字符串，则对该属性执行自增操作.
 */
ThinkingDataAnalyticsLib.prototype.userAdd = function (userProperties, callback) {
    if (!this._isCollectData()) {
        return;
    }
    if (_.check.isString(userProperties)) {
        var str = userProperties;
        userProperties = {};
        userProperties[str] = 1;
    }

    function isChecked(p) {
        for (var i in p) {
            if (!/-*\d+/.test(String(p[i]))) {
                return false;
            }
        }
        return true;
    }

    if (PropertyChecker.propertiesMust(userProperties)) {
        if (isChecked(userProperties) || !this._getConfig('strict')) {
            this._sendRequest({
                type: 'user_add',
                properties: userProperties
            }, callback);
        } else {
            Log.w('userAdd 属性中的值只能是数字');
        }
    }
};

/**
 * 追加 Array 类型的用户属性. 属性值必须是 Array.
 */
ThinkingDataAnalyticsLib.prototype.userAppend = function (userProperties, callback) {
    if (!this._isCollectData()) {
        return;
    }
    function isChecked(p) {
        for (var i in p) {
            if (!_.check.isArray(p[i])) {
                return false;
            }
        }
        return true;
    }

    if ((PropertyChecker.propertiesMust(userProperties) && isChecked(userProperties)) || !this._getConfig('strict')) {
        this._sendRequest({
            type: 'user_append',
            properties: userProperties
        }, callback);
    } else {
        Log.w('userAppend 属性中的值只能是 Array');
    }
};

ThinkingDataAnalyticsLib.prototype.userUniqAppend = function (userProperties, callback) {
    if (!this._isCollectData()) {
        return;
    }
    function isChecked(p) {
        for (var i in p) {
            if (!_.check.isArray(p[i])) {
                return false;
            }
        }
        return true;
    }

    if ((PropertyChecker.propertiesMust(userProperties) && isChecked(userProperties)) || !this._getConfig('strict')) {
        this._sendRequest({
            type: 'user_uniq_append',
            properties: userProperties
        }, callback);
    } else {
        Log.w('userUniqAppend 属性中的值只能是 Array');
    }
};

ThinkingDataAnalyticsLib.prototype.flush = function () {
    if (this.batchConsumer && !this._isDebug()) {
        this.batchConsumer.flush();
    }
};

/**
 * 删除用户. 该操作不可逆，谨慎使用.
 */
ThinkingDataAnalyticsLib.prototype.userDel = function (callback) {
    if (!this._isCollectData()) {
        return;
    }
    this._sendRequest({
        type: 'user_del'
    }, callback);
};

ThinkingDataAnalyticsLib.prototype._sendRequest = function (eventData, callback, tryBeacon) {
    var time = _.check.isUndefined(eventData.time) || !_.check.isDate(eventData.time) ? new Date() : eventData.time;
    var data = {
        data: [{
            '#type': eventData.type,
            '#time': _.formatDate(_.formatTimeZone(time, this._getConfig('zoneOffset'))),
            '#distinct_id': this['persistence'].getDistinctId()
        }]
    };
    if (this['persistence'].getAccountId()) {
        data.data[0]['#account_id'] = this['persistence'].getAccountId();
    }

    if (eventData.type === 'track' || eventData.type === 'track_update' || eventData.type === 'track_overwrite') {
        data.data[0]['#event_name'] = eventData.event;
        if (eventData.type === 'track_update' || eventData.type === 'track_overwrite') {
            data.data[0]['#event_id'] = eventData.extraId;
        } else if (eventData.firstCheckId) {
            data.data[0]['#first_check_id'] = eventData.firstCheckId;
        }
        let zoneOffset = 0 - (time.getTimezoneOffset() / 60.0);
        if (this._getConfig('zoneOffset')) {
            zoneOffset = this._getConfig('zoneOffset');
        }
        data.data[0]['properties'] = _.extend({}, {
            '#device_id': this['persistence'].getDeviceId(),
            '#zone_offset': zoneOffset,
        },
            _.info.properties(),
            this.getSuperProperties(),
            this.dynamicProperties ? this.dynamicProperties() : {},
            this.getPageProperty()
        );

        // 设置 #duration 属性.
        var startTimestamp = this['persistence'].removeEventTimer(eventData.event);
        if (!_.check.isUndefined(startTimestamp)) {
            var durationMillisecond = new Date()
                .getTime() - startTimestamp;
            var d = parseFloat((durationMillisecond / 1000).toFixed(3));
            //时间最大不能超过一天
            if (d > 24 * 60 * 60) {
                d = 24 * 60 * 60;
            }
            data.data[0]['properties']['#duration'] = d;
        }
    } else {
        data.data[0]['properties'] = {};
    }

    if (_.check.isObject(eventData.properties) && !_.check.isEmptyObject(eventData.properties)) {
        /*_.searchObjString(eventData.properties);*/
        _.extend(data.data[0].properties, eventData.properties);
    }

    _.searchObjDate(data.data[0], this._getConfig('zoneOffset'));
    //ajax 请求方式才支持数据加密
    if (this._getConfig('send_method') === 'ajax') {
        data.data[0] = _.generateEncryptyData(data.data[0], this._getConfig('secretKey'));
    }
    data['#app_id'] = this._getConfig('appId');
    //data['#flush_time'] = new Date().getTime();
    data['#flush_time'] = _.formatTimeZone(new Date(), this._getConfig('zoneOffset')).getTime();
    Log.i(data);

    // 通过原生 SDK 发送数据
    if (this._getConfig('useAppTrack')) {
        // eslint-disable-next-line camelcase
        var jsBridge = window.ThinkingData_APP_JS_Bridge || {};
        if ((typeof jsBridge === 'object') && jsBridge.thinkingdata_track) {
            jsBridge.thinkingdata_track(JSON.stringify(data));
            (typeof callback === 'function') && callback();
            return;
        } else if (/td-sdk-ios/.test(navigator.userAgent) && !window.MSStream) {
            var iframe = document.createElement('iframe');
            iframe.setAttribute('src', 'thinkinganalytics://trackEvent?event=' + _.encodeURIComponent(JSON.stringify(data)));
            document.documentElement.appendChild(iframe);
            iframe.parentNode.removeChild(iframe);
            iframe = null;
            (typeof callback === 'function') && callback();
            return;
        }
    }

    if (tryBeacon) {
        data.data[0]['#uuid'] = _.UUIDv4();
    }

    if (this.batchConsumer && !this._isDebug() && !tryBeacon) {
        this.batchConsumer.add(data.data[0]);
        return;
    }

    var urlData;
    if (this._isDebug()) {
        urlData = '&data=' + _.encodeURIComponent(JSON.stringify(data.data[0])) + '&source=client&deviceId=' + this.getDeviceId()
            + '&appid=' + this._getConfig('appId') + '&version=' + Config.LIB_VERSION;
        if (this._getConfig('mode') === 'debug_only') {
            urlData = urlData + '&dryRun=1';
        }
    } else {
        data = JSON.stringify(data);
        var base64Data = _.base64Encode(data);
        var crc = 'crc=' + _.hashCode(base64Data);
        urlData = '&data=' + _.encodeURIComponent(base64Data) + '&ext=' + _.encodeURIComponent(crc) + '&version=' + Config.LIB_VERSION;
    }

    if (tryBeacon && (typeof navigator !== undefined) && navigator.sendBeacon) {
        var formData = new FormData();
        if (this._isDebug()) {
            formData.append('data', _.encodeURIComponent(JSON.stringify(data.data[0])));
            formData.append('source', 'client');
            formData.append('deviceId', this.getDeviceId());
            formData.append('appid', this._getConfig('appId'));
            formData.append('version', Config.LIB_VERSION);
            if (this._getConfig('mode') === 'debug_only') {
                formData.append('dryRun', 1);
            }
        } else {
            formData.append('data', _.base64Encode(data));
        }
        navigator.sendBeacon(this._getConfig('serverUrl'), formData);
        return;
    }

    if (this._getConfig('send_method') === 'ajax') {
        new AjaxTask(urlData, this._getConfig('serverUrl'), this._getConfig('tryCount'), callback, this._isDebug()).run();
    } else {
        this._sendRequestWithImage(urlData, callback);
    }
};

var dataStoragePrefix = 'ta_';
var tabStoragePrefix = 'tab_';

function BatchConsumer(config) {
    this.config = config;
    this.timer = null;
    this.batchConfig = _.extend({
        'size': 5, //间隔多少毫秒发一次数据。
        'interval': 5000,
        'storageLimit': 200
    }, this.config['batch']);
    if (this.batchConfig.size < 1) {
        this.batchConfig.size = 1;
    }
    if (this.batchConfig.size > 30) {
        this.batchConfig.size = 30;
    }
    this.prefix = this.config['persistencePrefix'];
    this.tabKey = this.prefix + tabStoragePrefix + this.config['appId'];
    this.storageLimit = this.batchConfig['storageLimit'];
}

BatchConsumer.prototype = {

    batchInterval: function () {
        var self = this;
        self.timer = setTimeout(function () {
            self.recycle();
            self.send();
            clearTimeout(self.timer);
            self.batchInterval();
        }, this.batchConfig.interval);
    },

    add: function (data) {
        var d = data;
        var dataKey = this.prefix + dataStoragePrefix + this.config['appId'] + '_' + String(_.getRandom());
        var tabStorage = _.localStorage.get(this.tabKey);
        if (tabStorage === null) {
            //this.tabKey = tabStoragePrefix;
            tabStorage = [];
        } else {
            tabStorage = _.safeJSONParse(tabStorage) || [];
        }
        if (tabStorage.length <= this.storageLimit) {
            //如果缓存内的数据没有达到最大条数 保存
            tabStorage.push(dataKey);
            _.localStorage.set(this.tabKey, JSON.stringify(tabStorage));
            _.saveObjectVal(dataKey, d);
        } else {
            //先删除20条 再保存
            var deleteDatas = tabStorage.splice(0, 20);
            console.log('删除的数据:' + deleteDatas);
            tabStorage.push(dataKey);
            _.localStorage.set(this.tabKey, JSON.stringify(tabStorage));
            _.saveObjectVal(dataKey, d);
            var postData = {};
            var dList = [];
            for (var i = 0; i < deleteDatas.length; i++) {
                var item = _.readObjectVal(deleteDatas[i]);
                if (!_.hasEncrypty(item)) {
                    item = _.generateEncryptyData(item, this.config['secretKey']);
                }
                dList.push(item);
            }
            postData['data'] = dList;
            postData['#app_id'] = this.config['appId'];
            // postData['#flush_time'] = new Date().getTime();
            postData['#flush_time'] = _.formatTimeZone(new Date(), this.config['zoneOffset']).getTime();
            this.request(postData, deleteDatas);
        }
    },

    flush: function () {
        clearTimeout(this.timer);
        this.send();
        this.batchInterval();
    },

    send: function () {
        var tabStorage = _.localStorage.get(this.tabKey);
        if (tabStorage) {
            tabStorage = _.safeJSONParse(tabStorage) || [];
            if (tabStorage.length) {
                var postData = {};
                var data = [];
                var tabList = [];
                var len = tabStorage.length < this.batchConfig.size ? tabStorage.length : this.batchConfig.size;
                for (var i = 0; i < len; i++) {
                    var d = _.readObjectVal(tabStorage[i]);
                    if (!_.hasEncrypty(d)) {
                        d = _.generateEncryptyData(d, this.config['secretKey']);
                    }
                    data.push(d);
                    tabList.push(tabStorage[i]);
                }
                postData['data'] = data;
                postData['#app_id'] = this.config['appId'];
                //postData['#flush_time'] = new Date().getTime();
                postData['#flush_time'] = _.formatTimeZone(new Date(), this.config['zoneOffset']).getTime();
                this.request(postData, tabList);
            }
        }
    },

    request: function (data, dataKeys) {
        var self = this;
        Log.i('flush data');
        Log.i(data);
        var pData = JSON.stringify(data);
        var base64Data = _.base64Encode(pData);
        var crc = 'crc=' + _.hashCode(base64Data);
        var urlData = '&data=' + _.encodeURIComponent(base64Data) + '&ext=' + _.encodeURIComponent(crc) + '&version=' + Config.LIB_VERSION;
        new AjaxTask(urlData, this.config['serverUrl'], this.config['tryCount'], function () {
            //发送成功 删除缓存数据
            self.remove(dataKeys);
        }, false).run();
    },

    remove: function (dataKeys) {
        var tabStorage = _.localStorage.get(this.tabKey);
        if (tabStorage) {
            var tabStorageData = _.safeJSONParse(tabStorage) || [];
            for (var i = 0; i < dataKeys.length; i++) {
                var idx = _.indexOf(tabStorageData, dataKeys[i]);
                if (idx > -1) {
                    tabStorageData.splice(idx, 1);
                }
                _.localStorage.remove(dataKeys[i]);
            }
            _.localStorage.set(this.tabKey, JSON.stringify(tabStorageData));
        }
    },
    recycle: function () {
        var tabStorage = _.localStorage.get(this.tabKey);
        if (tabStorage) {
            tabStorage = _.safeJSONParse(tabStorage) || [];
            if (tabStorage.length === 0) {
                for (var i = 0; i < localStorage.length; i++) {
                    var key = localStorage.key(i);
                    if (key.indexOf(this.prefix + dataStoragePrefix + this.config['appId']) === 0) {
                        tabStorage.push(key);
                    }
                }
                if (tabStorage.length > 0) {
                    _.localStorage.set(this.tabKey, JSON.stringify(tabStorage));
                }
            }
        }
    },
};

class AjaxTask {
    constructor(data, serverUrl, tryCount, callback, isDebug) {
        this.data = data;
        this.serverUrl = serverUrl;
        this.tryCount = tryCount ? tryCount : 3;
        this.callback = callback;
        this.isDebug = isDebug;
    }
    run() {
        var xhr = null;
        if (window.XMLHttpRequest) {
            xhr = new XMLHttpRequest();
        } else {
            // eslint-disable-next-line no-undef
            xhr = new ActiveXObject('Microsoft.XMLHTTP');
        }
        xhr.open('post', this.serverUrl, true);
        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        var task = this;
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304) {
                    task.callback && task.callback();
                    if (task.isDebug) {
                        var response = JSON.parse(xhr.response);
                        if (response['errorLevel'] !== 0) {
                            Log.w(response);
                        } else {
                            Log.i(response);
                        }
                    }
                } else {
                    task.onFailed();
                }
            }
        };
        xhr.send(this.data);
    }
    onFailed() {
        if (--this.tryCount > 0) {
            this.run();
        }
    }
}

ThinkingDataAnalyticsLib.prototype._isDebug = function () {
    return this._getConfig('mode') === 'debug' || this._getConfig('mode') === 'debug_only';
};

ThinkingDataAnalyticsLib.prototype._sendRequestWithImage = function (data, callback) {
    function callAndDelete(img) {
        if (img && !img.hasCalled) {
            img.hasCalled = true;
            img.callback && img.callback();
        }
    }

    var url = (this._getConfig('serverUrl')
        .indexOf('?') !== -1) ? this._getConfig('serverUrl') : this._getConfig('serverUrl') + '?';
    var src = url + data;
    var img = document.createElement('img');

    img.callback = callback;
    setTimeout(callAndDelete, this._getConfig('dataSendTimeout'), img);

    img.onload = function () {
        this.onload = null;
        callAndDelete(this);
    };
    img.onerror = function () {
        this.onerror = null;
        callAndDelete(this);
    };
    img.onabort = function () {
        this.onabort = null;
        callAndDelete(this);
    };
    img.src = src;
};

/**
 * 发送事件. eventProperties 为可选项.
 */
ThinkingDataAnalyticsLib.prototype.track = function (eventName, eventProperties, eventTime, callback) {
    if (!this._isCollectData()) {
        return;
    }
    if (eventName === 'ta_page_show' || eventName === 'ta_page_hide') {
        this._sendRequest({
            type: 'track',
            event: eventName,
            time: _.check.isDate(eventTime) ? eventTime : new Date(),
            properties: eventProperties
        }, callback);
        return;
    }
    if ((PropertyChecker.event(eventName) && PropertyChecker.properties(eventProperties)) || !this._getConfig('strict')) {
        this._sendRequest({
            type: 'track',
            event: eventName,
            time: _.check.isDate(eventTime) ? eventTime : new Date(),
            properties: eventProperties
        }, callback);
    }
};

/**
 * 发送可更新的事件数据. 请联系数数客户成功获取进一步支持
 *
 * @param {object} taEvent 参数对象
 *  eventName: (必须) string 事件名称
 *  eventId: (必须) string 事件唯一 ID
 *  properties: (可选) object 事件属性
 *  eventTime: （可选）Date 事件时间
 *  callback: (可选) function 回调
 *
 * Example:
 * ta.trackUpdate(
 *  eventName: 'event_name',
 *  eventId: 'event_id_of_this_event',
 *  properties: {}
 * );
 */
ThinkingDataAnalyticsLib.prototype.trackUpdate = function (taEvent) {
    if (!this._isCollectData()) {
        return;
    }
    if (!_.check.isObject(taEvent)) {
        Log.e('trackUpdate 参数不符合要求');
        return;
    }

    if (PropertyChecker.event(taEvent.eventName) && PropertyChecker.properties(taEvent.properties) || !this._getConfig('strict')) {
        this._sendRequest({
            type: 'track_update',
            event: taEvent.eventName,
            time: _.check.isDate(taEvent.eventTime) ? taEvent.eventTime : new Date(),
            properties: taEvent.properties,
            extraId: taEvent.eventId
        }, taEvent.callback);
    }
};

/**
 * 发送可被重写的事件数据. 请联系数数客户成功获取进一步支持
 *
 * @param {object} taEvent 参数对象
 *  eventName: (必须) string 事件名称
 *  eventId: (必须) string 事件唯一 ID
 *  properties: (可选) object 事件属性
 *  eventTime: （可选）Date 事件时间
 *  callback: (可选) function 回调
 */
ThinkingDataAnalyticsLib.prototype.trackOverwrite = function (taEvent) {
    if (!this._isCollectData()) {
        return;
    }
    if (!_.check.isObject(taEvent)) {
        Log.e('trackOverwrite 参数不符合要求');
        return;
    }

    if (PropertyChecker.event(taEvent.eventName) && PropertyChecker.properties(taEvent.properties) || !this._getConfig('strict')) {
        this._sendRequest({
            type: 'track_overwrite',
            event: taEvent.eventName,
            time: _.check.isDate(taEvent.eventTime) ? taEvent.eventTime : new Date(),
            properties: taEvent.properties,
            extraId: taEvent.eventId
        }, taEvent.callback);
    }
};

/**
 * 发送首次触发事件. 请联系数数客户成功获取进一步支持
 *
 * @param {object} taEvent 参数对象
 *  eventName: (必须) string 事件名称
 *  firstCheckId: (可选) string 用于检测是否首次，默认会使用随机生成的设备 ID
 *  properties: (可选) object 事件属性
 *  eventTime: （可选）Date 事件时间
 *  callback: (可选) function 回调
 */
ThinkingDataAnalyticsLib.prototype.trackFirstEvent = function (taEvent) {
    if (!this._isCollectData()) {
        return;
    }
    if (!_.check.isObject(taEvent)) {
        Log.e('trackFirstEvent 参数不符合要求');
        return;
    }

    if (PropertyChecker.event(taEvent.eventName) && PropertyChecker.properties(taEvent.properties) || !this._getConfig('strict')) {
        this._sendRequest({
            type: 'track',
            event: taEvent.eventName,
            time: _.check.isDate(taEvent.eventTime) ? taEvent.eventTime : new Date(),
            properties: taEvent.properties,
            firstCheckId: taEvent.firstCheckId ? taEvent.firstCheckId : this.getDeviceId()
        }, taEvent.callback);
    }
};

/**
 * 发送事件，会用 sendBeacon 的方式先尝试上报一次，然后再用系统配置方式上报
 */
ThinkingDataAnalyticsLib.prototype.trackWithBeacon = function (eventName, eventProperties, eventTime, callback) {
    if (eventName === 'ta_page_hide') {
        this._sendRequest({
            type: 'track',
            event: eventName,
            time: _.check.isDate(eventTime) ? eventTime : new Date(),
            properties: eventProperties
        }, callback, true);
        return;
    }
    if ((PropertyChecker.event(eventName) && PropertyChecker.properties(eventProperties)) || !this._getConfig('strict')) {
        this._sendRequest({
            type: 'track',
            event: eventName,
            time: _.check.isDate(eventTime) ? eventTime : new Date(),
            properties: eventProperties
        }, callback, true);
    }
};

/**
 * 设置 #distinct_id. distinct_id 默认与 #device_id 相同.
 */
ThinkingDataAnalyticsLib.prototype.identify = function (id) {
    if (!this._isCollectData()) {
        return;
    }
    if (typeof id === 'number') {
        id = String(id);
    }
    if (PropertyChecker.userId(id) || !this._getConfig('strict')) {
        var distinctId = this['persistence'].getDistinctId();
        if (id !== distinctId) {
            this['persistence'].setDistinctId(id);
        }
    } else {
        Log.e('identify 的参数必须是字符串');
    }
};

ThinkingDataAnalyticsLib.prototype.getDistinctId = function () {
    return this['persistence'].getDistinctId();
};

ThinkingDataAnalyticsLib.prototype.getDeviceId = function () {
    return this['persistence'].getDeviceId();
};

ThinkingDataAnalyticsLib.prototype._isCollectData = function () {
    return this['persistence'].getOptTracking() && this['persistence'].getEnableTracking();
};

/**
 * 设置公共属性. 在支持缓存的情况下，公共属性会持久化到 localStorage 或者 cookie 中.
 * 与 setPageProperty 区别：setPageProperty 只对当前页面有效.
 * 如果 setPageProperty 设置了与公共属性同样的属性值，则 setPageProperty 会覆盖公共属性.
 */
ThinkingDataAnalyticsLib.prototype.setSuperProperties = function (superProperties) {
    if (!this._isCollectData()) {
        return;
    }
    if (PropertyChecker.propertiesMust(superProperties) || !this._getConfig('strict')) {
        this['persistence'].setSuperProperties(_.extend({}, this.getSuperProperties(), superProperties));
    } else {
        Log.w('setSuperProperties 参数不合法');
    }
};

ThinkingDataAnalyticsLib.prototype.getSuperProperties = function () {
    return this['persistence'].getSuperProperties();
};

ThinkingDataAnalyticsLib.prototype.clearSuperProperties = function () {
    if (!this._isCollectData()) {
        return;
    }
    this['persistence'].setSuperProperties({});
};

ThinkingDataAnalyticsLib.prototype.unsetSuperProperty = function (propertyName) {
    if (!this._isCollectData()) {
        return;
    }
    if (_.check.isString(propertyName)) {
        var superProperties = this.getSuperProperties();
        delete superProperties[propertyName];
        this['persistence'].setSuperProperties(superProperties);
    }
};

/**
 * 设置动态公共属性. 动态公共属性只对当前页面有效.
 * 如果动态公共属性中有与公共属性相同的属性名，则覆盖公共属性的值.
 *
 * setPageProperty 的值会覆盖动态公共属性的值.
 */
ThinkingDataAnalyticsLib.prototype.setDynamicSuperProperties = function (dynamicProperties) {
    if (!this._isCollectData()) {
        return;
    }
    if (typeof dynamicProperties === 'function') {
        if (PropertyChecker.properties(dynamicProperties()) || !this._getConfig('strict')) {
            this.dynamicProperties = dynamicProperties;
        } else {
            Log.w('动态公共属性必须返回合法的属性值');
        }
    } else {
        Log.w('setDynamicSuperProperties 的参数必须是 function 类型');
    }
};

/**
 * 对事件计时. 调用此函数之后，track eventName 会在属性中加入 #duration 表示时长, 单位为秒.
 */
ThinkingDataAnalyticsLib.prototype.timeEvent = function (eventName) {
    if (!this._isCollectData()) {
        return;
    }
    if (_.check.isUndefined(eventName)) {
        Log.w('No event name provided to timeEvent');
        return;
    }
    this['persistence'].setEventTimer(eventName, new Date()
        .getTime());
};

/**
 * track ta_pageview.
 */
ThinkingDataAnalyticsLib.prototype.quick = function (type, properties) {
    if (!this._isCollectData()) {
        return;
    }
    if (typeof type === 'string' && type === 'autoTrack') {
        var quickProperties = {};
        if (PropertyChecker.properties(properties)) {
            _.extend(quickProperties, properties);
        }
        this._sendRequest({
            type: 'track',
            event: 'ta_pageview',
            properties: _.extend(quickProperties, _.info.pageProperties())
        });
    } else if (typeof type === 'string' && type === 'siteLinker') {
        siteLinker.init(this, properties);
    } else {
        Log.w('quick方法中没有这个功能' + type);
    }
};

ThinkingDataAnalyticsLib.prototype._setConfig = function (config) {
    if (_.check.isObject(config)) {
        _.extend(this['config'], config);

        if (!this._getConfig('persistencePrefix')) {
            this['config']['persistencePrefix'] = this['config']['cookiePrefix'];
        }
        if (this['persistence']) {
            //this['persistence'].update_config(this['config']);
        }
        //Config.DEBUG = Config.DEBUG || this._getConfig('debug');
    }
};

ThinkingDataAnalyticsLib.prototype._getConfig = function (propName) {
    return this['config'][propName];
};


ThinkingDataAnalyticsLib.prototype.init = function (param) {
    if (_.check.isUndefined(this['config'])) {
        this['config'] = {};
        this.currentProps = this.currentProps || {};
        this._setConfig(_.extend({}, DEFAULT_CONFIG, param));

        this['persistence'] = new ThinkingDataPersistence(this['config']);
        var appId = this._getConfig('appId');
        if (!_.check.isUndefined(appId)) {
            this._setConfig({
                appId: appId.replace(/\s*/g, '')
            });
        }
        Log.showLog = this._getConfig('showLog');
        var sendMethod = this._getConfig('send_method');
        if ((sendMethod !== 'image') && (sendMethod !== 'ajax') && (sendMethod !== 'beacon')) {
            Log.i('send_method', sendMethod, 'is not supported. Changed to image as default value');
            this._setConfig({
                // eslint-disable-next-line camelcase
                send_method: 'image'
            });
        }
        new PageLifeCycle(this, this._getConfig('autoTrack')).start();
        if (this._isDebug()) {
            this._setConfig({
                serverUrl: _.url('basic', param.serverUrl) + '/data_debug'
            });
        } else {
            this._setConfig({
                serverUrl: _.url('basic', param.serverUrl) + '/sync_js'
            });
        }
        //是否开启数据批量发送
        if (this._getConfig('batch') !== undefined && this._getConfig('batch') !== false && _.localStorage.isSupported()) {
            this.batchConsumer = new BatchConsumer(this['config']);
            this.batchConsumer.batchInterval();
        }
    } else {
        Log.i('The ThinkingData libraray has been initialized.');
    }
};

class PageLifeCycle {

    constructor(taLib, config) {
        this.taLib = taLib;
        if (_.paramType(config) === 'Object' && _.paramType(config.pageShow) === 'Boolean') {
            this.autoPageShow = config.pageShow;
        } else {
            this.autoPageShow = false;
        }
        if (_.paramType(config) === 'Object' && _.paramType(config.pageHide) === 'Boolean') {
            this.autoPageHide = config.pageHide;
        } else {
            this.autoPageHide = false;
        }
    }

    start() {
        var page = this;
        if ('onpageShow' in window) {
            _.addEvent(window, 'pageShow', function () {
                page.trackPageShowEvent();
            });
            _.addEvent(window, 'pagehide', function () {
                //page.trackPageHideEventOnClose();
            });
        } else {
            _.addEvent(window, 'load', function () {
                page.trackPageShowEvent();
            });
            _.addEvent(window, 'beforeunload', function () {
                //page.trackPageHideEventOnClose();
            });
        }

        if ('onvisibilitychange' in document) {
            _.addEvent(document, 'visibilitychange', function () {
                if (document.hidden) {
                    //页面隐藏 发送ta_page_hide
                    page.trackPageHideEvent();
                } else {
                    //页面展示 发送ta_page_show
                    page.trackPageShowEvent();
                }
            });
        }

    }

    trackPageShowEvent() {
        if (this.autoPageShow) {
            this.taLib.track('ta_page_show', _.info.pageProperties());
        }
        this.taLib.timeEvent('ta_page_hide');
    }

    trackPageHideEvent() {
        if (this.autoPageHide) {
            this.taLib.trackWithBeacon('ta_page_hide', _.info.pageProperties());
        }
    }

    trackPageHideEventOnClose() {
        //如果页面隐藏的时候，发送了ta_page_hide，此时关闭不需要发送
        if (this.autoPageHide && this.isPageShow) {
            this.taLib.trackWithBeacon('ta_page_hide', _.info.pageProperties());
        }
    }

}

/**
 * 创建新的实例(只允许在 master instance 下调用).
 *
 * @param name 新实例的名称. 字符串类型. 必填.
 * @param param 新实例的配置参数. object 类型. 选填.
 *
 * 子实例与主实例共享 pageProperty 和 device id. 其 distinct_id 初始值为 device id.
 *
 * 子实例从主实例继承配置信息，默认不使用本地缓存. 如果需要使用本地缓存，在 param 中指明即可:
 * 	{
 * 		persistenceEnabled: true,
 * 	}
 * 注意: 相同 name 的子实例将会共享缓存名称.
 *
 * 使用方法(ta 为主实例):
 * 	ta.initInstance('newInstance');
 * 	ta.newInstance.identify('new_distinct_id');
 * 	ta.newInstance.track('test_event');
 *
 */
ThinkingDataAnalyticsLib.prototype.initInstance = function (name, param) {
    if (!_.check.isString(name) || (!_.check.isUndefined(param) && !_.check.isObject(param))) {
        Log.w('invalid parameter of initInstance(string, object).');
        return null;
    }

    if (this._getConfig('_name') !== MASTER_INSTANCE_NAME) {
        Log.w('This function is allowed for master instance only');
        return null;
    }

    if (name === MASTER_INSTANCE_NAME || this[name]) {
        Log.w('The name ', name, ' couldn\'t be used for create new instance.');
        return null;
    }

    if (_.check.isUndefined(param)) {
        param = {};
    }

    var instance = new ThinkingDataAnalyticsLib();
    var config = _.extend({}, this.config, {
        _name: name,
        persistenceEnabled: false,
        uuid: this.getDeviceId(),
    }, param);

    if (config.persistenceEnabled) {
        config.persistencePrefix = config.persistencePrefix + '_' + name;
    }

    instance.init(config);
    this[name] = instance;
};

/**
 * @param enabled 是否采集上报数据 默认为true,表示数据正常上报
 */
ThinkingDataAnalyticsLib.prototype.enableTracking = function (enabled) {
    if (typeof enabled === 'boolean') {
        this['persistence'].setEnableTracking(enabled);
    }
};

ThinkingDataAnalyticsLib.prototype.optOutTracking = function () {
    this['persistence'].setSuperProperties({});
    this['persistence'].setAccountId('');
    this['persistence'].clearEventTimer();
    this['persistence'].setOptTracking(false);
};

ThinkingDataAnalyticsLib.prototype.optInTracking = function () {
    this['persistence'].setOptTracking(true);
};

ThinkingDataAnalyticsLib.prototype.setTrackStatus = function (config) {
    if (_.check.isObject(config)) {
        var status = config['status'];
        if (status === 'pause') {
            this.enableTracking(false);
        } else if (status === 'stop') {
            this.optOutTracking();
        } else if (status === 'normal') {
            this.enableTracking(true);
            this.optInTracking();
        }
    }
};

var siteLinker = {};
siteLinker.getPartUrl = function (part) {
    var t = false;
    var l = this.option.length;
    if (l) {
        for (var i = 0; i < l; i++) {
            if (part.indexOf(this.option[i]['part_url']) > -1) {
                return true;
            }
        }
    }
    return t;
};
siteLinker.getPartHash = function (part) {
    var len = this.option.length;
    var temp = false;
    if (len) {
        for (var i = 0; i < len; i++) {
            if (part.indexOf(this.option[i]['part_url']) > -1) {
                return this.option[i]['after_hash'];
            }
        }
    }
    return !!temp;
};
siteLinker.getCurrenId = function () {
    var distinctId = this.ta.getDistinctId();
    var urlId = 'd' + distinctId;
    return encodeURIComponent(urlId);
};
siteLinker.rewriteUrl = function (url, target) {
    var reg = /([^?#]+)(\?[^#]*)?(#.*)?/;
    var arr = reg.exec(url),
        nurl = '';
    if (!arr) {
        return;
    }
    var host = arr[1] || '',
        search = arr[2] || '',
        hash = arr[3] || '';
    var idIndex;
    if (this.getPartHash(url)) {
        idIndex = hash.indexOf('_tasdk');
        var queryIndex = hash.indexOf('?');
        if (queryIndex > -1) {
            if (idIndex > -1) {
                nurl = host + search + '#' + hash.substring(1, idIndex) + '_tasdk=' + this.getCurrenId();
            } else {
                nurl = host + search + '#' + hash.substring(1) + '&_tasdk=' + this.getCurrenId();
            }
        } else {
            nurl = host + search + '#' + hash.substring(1) + '?_tasdk=' + this.getCurrenId();
        }
    } else {
        idIndex = search.indexOf('_tasdk');
        var hasQuery = /^\?(\w)+/.test(search);
        if (hasQuery) {
            if (idIndex > -1) {
                nurl = host + '?' + search.substring(1, idIndex) + '_tasdk=' + this.getCurrenId() + hash;
            } else {
                nurl = host + '?' + search.substring(1) + '&_tasdk=' + this.getCurrenId() + hash;
            }
        } else {
            nurl = host + '?' + search.substring(1) + '_tasdk=' + this.getCurrenId() + hash;
        }
    }

    if (target) {
        target.href = nurl;
    }
    return nurl;
};
siteLinker.addClickListen = function () {
    var site = this;
    var clickFn = function (event) {
        var target = event.target;
        var nodeName = target.tagName.toLowerCase();
        var parentTarget = target.parentNode;
        var sdkUrl;
        var sdkTarget;
        if ((nodeName === 'a' && target.href) || (parentTarget && parentTarget.tagName && parentTarget.tagName.toLowerCase() === 'a' && parentTarget.href)) {
            if (nodeName === 'a' && target.href) {
                sdkUrl = target.href;
                sdkTarget = target;
            } else {
                sdkUrl = parentTarget.href;
                sdkTarget = parentTarget;
            }
            var location = _.URL(sdkUrl);
            var protocol = location.protocol;
            if (protocol === 'http:' || protocol === 'https:') {
                if (site.getPartUrl(sdkUrl)) {
                    site.rewriteUrl(sdkUrl, sdkTarget);
                }
            }
        }
    };
    _.addSiteEvent(document, 'mousedown', clickFn);
    if (!!window.PointerEvent && 'maxTouchPoints' in window.navigator && window.navigator.maxTouchPoints >= 0) {
        _.addSiteEvent(document, 'pointerdown', clickFn);
    }
};
siteLinker.getUrlId = function () {
    var taId = location.href.match(/_tasdk=([aufd][^\?\#\&\=]+)/);
    if (_.check.isArray(taId) && taId[1]) {
        var uid = decodeURIComponent(taId[1]);
        return uid;
    } else {
        return '';
    }
};
siteLinker.setRefferId = function () {
    var distinctId = this.ta.getDistinctId();
    var urlId = this.getUrlId();
    if (urlId === '') {
        return false;
    }
    var isAnonymousId = urlId.substring(0, 1) === 'd';
    urlId = urlId.substring(1);
    if (urlId === distinctId) {
        return false;
    }
    if (urlId && isAnonymousId) {
        this.ta.identify(urlId);
    }
};
siteLinker.init = function (ta, option) {
    //只需要初始化一次
    if (this.isInited) {
        return;
    }
    this.isInited = true;
    this.ta = ta;
    this.setRefferId();
    if (_.check.isObject(option) && _.check.isArray(option.linker) && option.linker.length > 0) {
        this.addClickListen();
    } else {
        return;
    }
    this.option = option.linker;
    this.option = resolveOption(this.option);
    function resolveOption(option) {
        var len = option.length,
            arr = [];
        for (var i = 0; i < len; i++) {
            if (/[A-Za-z0-9]+\./.test(option[i].part_url) && Object.prototype.toString.call(option[i].after_hash) === '[object Boolean]') {
                arr.push(option[i]);
            } else {
                Log.w('linker配置的第 ' + (i + 1) + ' 项格式不正确，请检查参数格式');
            }
        }
        return arr;
    }
};
var tdMaster;
export function initFromSnippet() {
    if (tdMaster && tdMaster.isLoadSDK) {
        return;
    }
    var libName = window['ThinkingDataAnalyticalTool'];
    if (libName && typeof (tdMaster = window[libName]) === 'function') {
        var snippetVersion = tdMaster['__SV'] || 0;
        if (snippetVersion < 1.1) {
            console.error('Version mismatch; please ensure you\'re using the latest version of the thinkingdata snippet.');
            return;
        }

        tdMaster.isLoadSDK = true;
        var instance = new ThinkingDataAnalyticsLib();
        instance.init(tdMaster.param);

        // 创建子实例
        if (tdMaster._q1 && _.check.isArray(tdMaster._q1) && tdMaster._q1.length > 0) {
            _.each(tdMaster._q1, function (content) {
                instance[content[0]].apply(instance, slice.call(content[1]));
            });
        }

        if (typeof (instance._getConfig('loaded')) === 'function') {
            instance._getConfig('loaded')(instance);
        }
        window[libName] = instance;

        if (tdMaster._q && _.check.isArray(tdMaster._q) && tdMaster._q.length > 0) {
            _.each(tdMaster._q, function (content) {
                if (content.length === 3) {
                    instance[content[2]][content[0]].apply(instance[content[2]], slice.call(content[1]));
                } else {
                    instance[content[0]].apply(instance, slice.call(content[1]));
                }
            });
        }
    }
}

export function initAsModule() {
    tdMaster = new ThinkingDataAnalyticsLib();
    return tdMaster;
}
