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

var MASTER_INSTANCE_NAME = 'thinkingdata';

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
    enableCalibrationTime: false,
    imgUseCrossorigin: false,
    disablePresetProperties: [],
    disableEventList: []
};

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
    if (_.check.isValidString(distinctId)) {
        this._set('distinct_id', distinctId);
    }
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

/**
 * @class
 */
var TDAnalytics = function () {
    window.addEventListener('message', function (event) {
        if (event.data === '__ta_init_port__') {
            if (event.ports[0] !== null) {
                window.taHarmonyPort = event.ports[0];
            }
        }
    });
};

/**
 * Automatically upload the click event of the page element
 * @param {Object} dom Rules for elements that need to automatically collect click events
 * @param {String} evenName event name
 * @param {Object} eventProperties event properties
 */
TDAnalytics.prototype.trackLink = function (dom, eventName, eventProperties) {
    if (!this._isCollectData()) {
        return;
    }
    let strict = this._getConfig('strict');
    if (!PropertyChecker.properties(eventProperties) && strict) {
        Log.w('trackLink failed due to invalid properties.');
        return;
    }

    if (!dom || !_.check.isObject(dom)) {
        return;
    }

    const matchRules = this._compileMatchRules(dom);
    document.removeEventListener('click', this._linkClickHandler);
    this._linkClickHandler = (e) => {
        this._handleLinkClick(e, matchRules, eventName, eventProperties, strict);
    };
    document.addEventListener('click', this._linkClickHandler);
};

TDAnalytics.prototype._handleLinkClick = function (e, matchRules, eventName, eventProperties, strict) {
    let target = e.target;
    while (target && target !== document) {
        if (matchRules(target)) {
            break;
        }
        target = target.parentNode;
    }
    if (!target || target === document) {
        return;
    }
    const disbaleList = this._getConfig('disablePresetProperties');
    const properties = _.extend({}, _.info.pageProperties(disbaleList), eventProperties);
    if (!_.isDisableProperties(disbaleList, '#element_type')) {
        properties['#element_type'] = target.nodeName.toLowerCase();
    }
    if (_.check.isUndefined(properties['name'])) {
        properties['name'] = target.getAttribute('td-name') || target.innerHTML || target.value || 'Unable to get Identify';
    }
    this._sendRequest({
        type: 'track',
        event: eventName,
        properties: strict ? PropertyChecker.stripProperties(properties) : properties,
    });
};

TDAnalytics.prototype._compileMatchRules = function (dom) {
    const rules = {
        tags: new Set(),
        classes: new Set(),
        ids: new Set()
    };
    _.each(dom, (value, key) => {
        if (value && _.check.isArray(value)) {
            _.each(value, (typeName) => {
                switch (key) {
                    case 'tag':
                        rules.tags.add(typeName.toLowerCase());
                        break;
                    case 'class':
                        rules.classes.add(typeName);
                        break;
                    case 'id':
                        rules.ids.add(typeName);
                        break;
                }
            });
        }
    });
    return function (element) {
        if (!element) return false;
        if (rules.ids.size > 0 && rules.ids.has(element.id)) {
            return true;
        }
        if (rules.tags.size > 0 && rules.tags.has(element.nodeName.toLowerCase())) {
            return true;
        }
        if (rules.classes.size > 0) {
            const classList = element.classList;
            for (const cls of rules.classes) {
                if (classList.contains(cls)) {
                    return true;
                }
            }
        }
        return false;
    };
};

/**
 * Set page public properties
 * @param {Object} obj page public properties
 */
TDAnalytics.prototype.setPageProperty = function (obj) {
    if (!this._isCollectData()) {
        return;
    }
    if (PropertyChecker.properties(obj) || !this._getConfig('strict')) {
        _.extend(this.currentProps, obj);
    } else {
        Log.w('Page property setting error');
    }
};

/**
 * Get the page public properties of the current page
 * @returns page public properties
 */
TDAnalytics.prototype.getPageProperty = function () {
    return this.currentProps;
};

/**
 *  Gets prefabricated properties for all events.
 * @returns preset properties
 */
TDAnalytics.prototype.getPresetProperties = function () {
    var properties = _.info.properties(this._getConfig('disablePresetProperties'));
    var presetProperties = {};
    if (properties['#os']) {
        presetProperties.os = properties['#os'];
    }
    if (properties['#screen_width']) {
        presetProperties.screenWidth = properties['#screen_width'];
    }
    if (properties['#screen_height']) {
        presetProperties.screenHeight = properties['#screen_height'];
    }
    if (properties['#browser']) {
        presetProperties.browser = properties['#browser'];
    }
    if (properties['#browser_version']) {
        presetProperties.browserVersion = properties['#browser_version'];
    }
    presetProperties.deviceId = this.getDeviceId();
    let zoneOffset = 0 - (_.getCurrentDate().getTimezoneOffset() / 60.0);
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
 * Set the account ID. Note: this method will not send login event.
 * @param {String} accountId account id
 */
TDAnalytics.prototype.login = function (accountId) {
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
            Log.i('[ThinkingData] Info: Login SDK, AccountId = ' + accountId);
            this.notifyAllObserver('onAccountChanged', {
                accountId: accountId,
                distinctId: this.getDistinctId()
            });
        }
    } else {
        Log.e('The parameters of the login API must be strings');
    }
};

/**
 * Clear the account ID. Note: this method will not report logout event
 * @param {Boolean} isChangeId whether to reset distinct ID.
 */
TDAnalytics.prototype.logout = function (isChangeId) {
    if (!this._isCollectData()) {
        return;
    }
    if (isChangeId === true) {
        var distinctId = _.UUID();
        this['persistence'].setDistinctId(distinctId);
    }
    this['persistence'].setAccountId('');
    Log.i('[ThinkingData] Info: Logout SDK');
    this.notifyAllObserver('onAccountChanged', {
        accountId: '',
        distinctId: this.getDistinctId()
    });
};

/**
 * Set the user property. If the property already exists, use this property value to overwrite the previous property.
 * @param {Object} userProperties user properties
 * @param {Function} callback Event reporting result callback
 */
TDAnalytics.prototype.userSet = function (userProperties, callback) {
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
 * Set the user Property, if the property already exists, discard the current data.
 * @param {Object} userProperties user properties
 * @param {Function} callback Event reporting result callback
 */
TDAnalytics.prototype.userSetOnce = function (userProperties, callback) {
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
 * Reset user property
 * @param {String} userProperties user property
 * @param {Function} callback Event reporting result callback
 */
TDAnalytics.prototype.userUnset = function (property, callback) {
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
 * Accumulate user property. The property value is only allowed to be Number type.
 * @param {String} userProperties user properties
 * @param {Function} callback Event reporting result callback
 */
TDAnalytics.prototype.userAdd = function (userProperties, callback) {
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
            Log.w('The property value of useradd api must be a number');
        }
    }
};

/**
 * Appends a user property of type Array. The property value must be an Array.
 * @param {String} userProperties user properties
 * @param {Function} callback Event reporting result callback
 */
TDAnalytics.prototype.userAppend = function (userProperties, callback) {
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
        Log.w('The value in the userAppend property can only be Array');
    }
};
/**
 * The element appended to the library needs to be done to remove the processing,and then import.
 * @param {Object} userProperties user properties
 * @param {Function} callback Event reporting result callback
 */
TDAnalytics.prototype.userUniqAppend = function (userProperties, callback) {
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
        Log.w('The value in the userUniqAppend property can only be Array');
    }
};

/**
 * Empty the cache queue. When this api is called, the data in the current cache queue will attempt to be reported.
 * If the report succeeds, local cache data will be deleted.
 */
TDAnalytics.prototype.flush = function () {
    if (this.batchConsumer && !this._isDebug()) {
        this.batchConsumer.flush();
    }
};

TDAnalytics.prototype.userDel = function (callback) {
    this.userDelete(callback);
};

/**
 * Delete user. This operation is irreversible, use with caution.
 * @param {Function} callback result callback
 */
TDAnalytics.prototype.userDelete = function (callback) {
    if (!this._isCollectData()) {
        return;
    }
    this._sendRequest({
        type: 'user_del'
    }, callback);
};

TDAnalytics.prototype.setLogPrintListener = function (listener) {
    Log.listener = listener;
};

TDAnalytics.prototype._sendRequest = function (eventData, callback, tryBeacon) {
    // var timeCalibration = 6;
    // if (this._getConfig('enableCalibrationTime')) {
    //     if (!_.check.isUndefined(eventData.time) && _.check.isDate(eventData.time)) {
    //         timeCalibration = 5;
    //     } else {
    //         timeCalibration = 3;
    //     }
    // }
    var time = _.check.isUndefined(eventData.time) || !_.check.isDate(eventData.time) ? _.getCurrentDate() : eventData.time;
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
        if (this._getConfig('zoneOffset') !== undefined) {
            zoneOffset = this._getConfig('zoneOffset');
        }
        data.data[0]['properties'] = _.extend({}, {
            '#device_id': this['persistence'].getDeviceId(),
            '#zone_offset': zoneOffset,
        }, _.info.properties(this._getConfig('disablePresetProperties')), this.getSuperProperties(), this.dynamicProperties ? this.dynamicProperties() : {}, this.getPageProperty()
        );

        var startTimestamp = this['persistence'].removeEventTimer(eventData.event);
        if (!_.check.isUndefined(startTimestamp)) {
            var durationMillisecond = _.getCurrentTimeStamp() - startTimestamp;
            var d = parseFloat((durationMillisecond / 1000).toFixed(3));
            if (d > 24 * 60 * 60) {
                d = 24 * 60 * 60;
            }
            data.data[0]['properties']['#duration'] = d;
        }
        //add time_calibration property
        // data.data[0]['properties']['#time_calibration'] = timeCalibration;
    } else {
        data.data[0]['properties'] = {};
    }

    if (_.check.isObject(eventData.properties) && !_.check.isEmptyObject(eventData.properties)) {
        /*_.searchObjString(eventData.properties);*/
        _.extend(data.data[0].properties, eventData.properties);
    }

    _.searchObjDate(data.data[0], this._getConfig('zoneOffset'));
    if (this._getConfig('send_method') === 'ajax') {
        data.data[0] = _.generateEncryptyData(data.data[0], this._getConfig('secretKey'));
    }
    data['#app_id'] = this._getConfig('appId');
    data['#flush_time'] = _.formatTimeZone(_.getCurrentDate(), this._getConfig('zoneOffset')).getTime();
    this.notifyAllObserver('onDataEnqueue', {
        appId: this._getConfig('appId'),
        event: data.data[0]
    });

    // Send data via native SDK
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
        } else if (window.ThinkingData_APP_Flutter_Bridge) {
            window.ThinkingData_APP_Flutter_Bridge.postMessage(JSON.stringify(data));
            return;
        } else if (window.ReactNativeWebView && window.ThinkingData_APP_ReactNative_Bridge) {
            window.ThinkingData_APP_ReactNative_Bridge(JSON.stringify({ type: 'tdanalytics_reactnative_sdk', event: data }));
            return;
        } else if (window.taHarmonyPort) {
            window.taHarmonyPort.postMessage(JSON.stringify(data));
            return;
        }
    }

    // if (tryBeacon) {
    //     data.data[0]['#uuid'] = _.UUIDv4();
    // }

    if (this.batchConsumer && !(this._isDebug() || _.isDebug(eventData.debugMode)) && !tryBeacon) {
        data.data[0]['#uuid'] = _.UUIDv4();
        this.batchConsumer.add(data.data[0]);
        return;
    }

    Log.i('[ThinkingData] Info: Post data : ');
    Log.i(data);

    var urlData;
    if (this._isDebug() || _.isDebug(eventData.debugMode)) {
        urlData = '&data=' + _.encodeURIComponent(JSON.stringify(data.data[0])) + '&source=client&deviceId=' + this.getDeviceId()
            + '&appid=' + this._getConfig('appId') + '&version=' + Config.LIB_VERSION;
        if (this._getConfig('mode') === 'debug_only' || _.isDebugOnly(eventData.debugMode)) {
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
            formData.append('data', JSON.stringify(data.data[0]));
            // formData.append('data', _.encodeURIComponent(JSON.stringify(data.data[0])));
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
    var sUrl = this._getConfig('serverUrl');
    if (_.isDebug(eventData.debugMode)) {
        sUrl = this._getConfig('originalUrl') + '/data_debug';
    }
    if (this._getConfig('send_method') === 'ajax') {
        new AjaxTask(urlData, sUrl, this._getConfig('tryCount'), callback, null, this._isDebug(), this._getConfig('dataSendTimeout')).run();
    } else {
        this._sendRequestWithImage(sUrl, urlData, callback);
    }
};

var tabStoragePrefix = 'tab_';
var storagePrefix = 'ta_jssdk_';

function BatchConsumer(config) {
    this.config = config;
    this.timer = null;
    this.batchConfig = _.extend({
        'size': 6,
        'interval': 6000,
        'maxLimit': 500
    }, this.config['batch']);
    if (this.batchConfig.size < 1) {
        this.batchConfig.size = 1;
    }
    if (this.batchConfig.size > 30) {
        this.batchConfig.size = 30;
    }
    this.maxLimit = this.batchConfig['maxLimit'];
    this.batchList = [];
    //Synchronize data not sent last time
    this.storageKey = storagePrefix + this.config.appId;
    try {
        var storageList = JSON.parse(_.localStorage.get(this.storageKey));
        if (_.check.isArray(storageList)) {
            this.batchList = storageList;
        }
        var prefix = this.config['persistencePrefix'];
        var tabKey = prefix + tabStoragePrefix + this.config.appId;
        var tabs = JSON.parse(_.localStorage.get(tabKey));
        if (_.check.isArray(tabs)) {
            for (var i = 0; i < tabs.length; i++) {
                var oldItem = JSON.parse(_.localStorage.get(tabs[i]));
                console.log(oldItem);
                this.batchList.push(oldItem);
                _.localStorage.remove(tabs[i]);
            }
            _.localStorage.remove(tabKey);
        }
    } catch (error) {
        Log.e(error);
    }
    this.dataHasChange = false;
    this.dataSendTimeStamp = 0;
}

BatchConsumer.prototype = {

    batchInterval: function () {
        this.loopWrite();
        this.loopSend();
    },

    loopWrite: function () {
        var self = this;
        setTimeout(function () {
            self.batchWrite();
            self.loopWrite();
        }, 500);
    },

    batchWrite: function () {
        if (this.dataHasChange) {
            this.dataHasChange = false;
            _.localStorage.set(this.storageKey, JSON.stringify(this.batchList));
        }
    },

    loopSend: function () {
        var self = this;
        self.timer = setTimeout(function () {
            self.batchSend();
            clearTimeout(self.timer);
            self.loopSend();
        }, this.batchConfig.interval);
    },


    add: function (data) {
        Log.i('[ThinkingData] Info: Enqueue data : ');
        Log.i(data);
        if (this.batchList.length > this.maxLimit) {
            this.batchList.shift();
        }
        this.batchList.push(data);
        this.dataHasChange = true;
        if (this.batchList.length > this.batchConfig.size) {
            this.batchSend();
        }
    },


    batchSend: function () {
        var nowTimeStamp = _.getCurrentTimeStamp();
        if (this.dataSendTimeStamp !== 0 && nowTimeStamp - this.dataSendTimeStamp < (this.config.dataSendTimeout + 500)) {
            return;
        }
        this.dataSendTimeStamp = nowTimeStamp;
        var sendData;
        if (this.batchList.length > 50) {
            sendData = this.batchList.slice(0, 50);
        } else {
            sendData = this.batchList;
        }
        var len = sendData.length;
        var self = this;
        if (len > 0) {
            var postData = {};
            postData['data'] = sendData;
            postData['#app_id'] = this.config['appId'];
            postData['#flush_time'] = _.getCurrentTimeStamp();
            Log.i('[ThinkingData] Debug: Send event, Request =');
            Log.i(postData);
            var pData = JSON.stringify(postData);
            var base64Data = _.base64Encode(pData);
            var crc = 'crc=' + _.hashCode(base64Data);
            var urlData = '&data=' + _.encodeURIComponent(base64Data) + '&ext=' + _.encodeURIComponent(crc) + '&version=' + Config.LIB_VERSION;
            new AjaxTask(urlData, this.config['serverUrl'], 0, function () {
                self.batchRemove(len);
            }, function () {
                self.dataSendTimeStamp = 0;
            }, false, this.config.dataSendTimeout).run();
        }
    },

    flush: function () {
        clearTimeout(this.timer);
        this.batchSend();
        this.loopSend();
    },

    batchRemove(len) {
        this.dataSendTimeStamp = 0;
        this.batchList.splice(0, len);
        this.dataHasChange = true;
        this.batchWrite();
        if (this.batchList.length > 0) {
            this.flush();
        }
    }
};

class AjaxTask {
    constructor(data, serverUrl, tryCount, success, error, isDebug, dataSendTimeout) {
        this.data = data;
        this.serverUrl = serverUrl;
        this.tryCount = tryCount === undefined || tryCount === null ? 3 : tryCount;
        this.success = success;
        this.error = error;
        this.isDebug = isDebug;
        this.dataSendTimeout = dataSendTimeout;
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
        var errorTimer;
        function abort() {
            try {
                if (xhr && typeof xhr === 'object' && xhr.abort) {
                    xhr.abort();
                }
            } catch (error) {
                Log.e(error);
            }
            if (errorTimer) {
                clearTimeout(errorTimer);
                errorTimer = null;
                task.error && task.error();
                xhr.onreadystatechange = null;
                xhr.onload = null;
                xhr.onerror = null;
            }
        }
        errorTimer = setTimeout(function () {
            abort();
        }, this.dataSendTimeout);
        xhr.onreadystatechange = function () {
            try {
                if (xhr.readyState === 4) {
                    if (xhr.status >= 100 && xhr.status < 200) {
                        Log.i('Ignoring temporary status code 1xx.');
                    } else if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304) {
                        task.success && task.success();
                        if (errorTimer) {
                            clearTimeout(errorTimer);
                            errorTimer = null;
                        }
                        if (task.isDebug) {
                            var response = JSON.parse(xhr.response);
                            if (response['errorLevel'] !== 0) {
                                Log.w(response);
                            } else {
                                Log.i(response);
                            }
                        }
                    } else {
                        task.error && task.error();
                        if (errorTimer) {
                            clearTimeout(errorTimer);
                            errorTimer = null;
                        }
                        if (task.tryCount > 0) {
                            task.onFailed();
                        }
                    }
                }
            } catch (error) {
                Log.e(error);
            }
        };
        xhr.send(this.data);
    }
    onFailed() {
        if (--this.tryCount >= 0) {
            this.run();
        }
    }
}

TDAnalytics.prototype._isDebug = function () {
    return this._getConfig('mode') === 'debug' || this._getConfig('mode') === 'debug_only';
};

TDAnalytics.prototype._sendRequestWithImage = function (srl, data, callback) {
    function callAndDelete(img) {
        if (img && !img.hasCalled) {
            img.hasCalled = true;
            img.callback && img.callback();
        }
    }

    var url = (srl.indexOf('?') !== -1) ? srl : srl + '?';
    var src = url + data;
    var img = document.createElement('img');

    img.callback = callback;
    if (this._getConfig('imgUseCrossorigin')) {
        img.crossOrigin = 'anonymous';
    }
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
 * Send event. eventProperties is optional
 * @param {String} eventName event name
 * @param {Object} eventProperties event properties
 * @param {Date} eventTime event time
 * @param {Function} callback Event reporting result callback
 */
TDAnalytics.prototype.track = function (eventName, eventProperties, eventTime, callback) {
    if (!this._isCollectData()) {
        return;
    }
    if (eventName === 'ta_page_show' || eventName === 'ta_page_hide') {
        this._sendRequest({
            type: 'track',
            event: eventName,
            time: eventTime,
            properties: eventProperties
        }, callback);
        return;
    }
    var disableEventList = this._getConfig('disableEventList');
    if (this._getConfig('disableEventList') !== null && _.check.isArray(disableEventList) && disableEventList.includes(eventName)) {
        return;
    }
    if ((PropertyChecker.event(eventName) && PropertyChecker.properties(eventProperties)) || !this._getConfig('strict')) {
        this._sendRequest({
            type: 'track',
            event: eventName,
            time: eventTime,
            properties: eventProperties
        }, callback);
    }
};

TDAnalytics.prototype.trackInternal = function (options) {
    if (!this._isCollectData()) {
        return;
    }
    this._sendRequest({
        type: 'track',
        event: options.eventName,
        properties: options.properties,
        debugMode: options.debugMode
    });
};

/**
 * Sending Updatable Event
 * @param {Object} taEvent
 *  eventName:required
 *  eventId: required
 *  properties: optional
 *  eventTime: optional
 *  callback: optional
 *
 * Example:
 * ta.trackUpdate(
 *  eventName: 'event_name',
 *  eventId: 'event_id_of_this_event',
 *  properties: {}
 * );
 */
TDAnalytics.prototype.trackUpdate = function (taEvent) {
    if (!this._isCollectData()) {
        return;
    }
    if (!_.check.isObject(taEvent)) {
        Log.e('The parameter of updateble event does not meet the requirements');
        return;
    }

    if (PropertyChecker.event(taEvent.eventName) && PropertyChecker.properties(taEvent.properties) || !this._getConfig('strict')) {
        this._sendRequest({
            type: 'track_update',
            event: taEvent.eventName,
            time: taEvent.eventTime,
            properties: taEvent.properties,
            extraId: taEvent.eventId
        }, taEvent.callback);
    }
};

/**
 * Sending Overwritable Event
 * @param {object} taEvent
 *  eventName: required
 *  eventId: required
 *  properties: optional
 *  eventTime: optional
 *  callback: optional
 */
TDAnalytics.prototype.trackOverwrite = function (taEvent) {
    if (!this._isCollectData()) {
        return;
    }
    if (!_.check.isObject(taEvent)) {
        Log.e('The parameter of overwritable event  does not meet the requirements');
        return;
    }

    if (PropertyChecker.event(taEvent.eventName) && PropertyChecker.properties(taEvent.properties) || !this._getConfig('strict')) {
        this._sendRequest({
            type: 'track_overwrite',
            event: taEvent.eventName,
            time: taEvent.eventTime,
            properties: taEvent.properties,
            extraId: taEvent.eventId
        }, taEvent.callback);
    }
};

TDAnalytics.prototype.trackFirstEvent = function (taEvent) {
    this.trackFirst(taEvent);
};

/**
 * Sending First Event
 * @param {object} taEvent
 *  eventName:required
 *  firstCheckId: optional,By default a randomly generated device ID will be used
 *  properties:optional
 *  eventTime: optional
 *  callback: optional
 */
TDAnalytics.prototype.trackFirst = function (taEvent) {
    if (!this._isCollectData()) {
        return;
    }
    if (!_.check.isObject(taEvent)) {
        Log.e('The parameter of first event does not meet the requirements');
        return;
    }

    if (PropertyChecker.event(taEvent.eventName) && PropertyChecker.properties(taEvent.properties) || !this._getConfig('strict')) {
        this._sendRequest({
            type: 'track',
            event: taEvent.eventName,
            time: taEvent.eventTime,
            properties: taEvent.properties,
            firstCheckId: taEvent.firstCheckId ? taEvent.firstCheckId : this.getDeviceId()
        }, taEvent.callback);
    }
};

/**
 * First try to report the event through sendBeacon, and then use the system configuration method to report the event
 * @param {String} eventName event name
 * @param {Object} eventProperties event properties
 * @param {Date} eventTime event time
 * @param {Function} callback Event reporting result callback
 */
TDAnalytics.prototype.trackWithBeacon = function (eventName, eventProperties, eventTime, callback) {
    if (eventName === 'ta_page_hide') {
        this._sendRequest({
            type: 'track',
            event: eventName,
            time: eventTime,
            properties: eventProperties
        }, callback, true);
        return;
    }
    if ((PropertyChecker.event(eventName) && PropertyChecker.properties(eventProperties)) || !this._getConfig('strict')) {
        this._sendRequest({
            type: 'track',
            event: eventName,
            time: eventTime,
            properties: eventProperties
        }, callback, true);
    }
};

TDAnalytics.prototype.identify = function (id) {
    this.setDistinctId(id);
};

/**
 * Setting DistinctId.Default disinct id is the same as device id
 * @param {String} id distinct id
 */
TDAnalytics.prototype.setDistinctId = function (id) {
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
            Log.i('[ThinkingData] Info: Setting distinct ID, DistinctId = ' + id);
            this.notifyAllObserver('onAccountChanged', {
                accountId: this.getAccountId(),
                distinctId: id
            });
        }
    } else {
        Log.e('The parameter of setDistinctId API requires a string');
    }
};

/**
 * Get a visitor ID: The #distinct_id value in the reported data.
 * @returns distinct ID
 */
TDAnalytics.prototype.getDistinctId = function () {
    return this['persistence'].getDistinctId();
};

TDAnalytics.prototype.getAccountId = function () {
    return this['persistence'].getAccountId();
};

TDAnalytics.prototype.getSDKVersion = function(){
    return Config.LIB_VERSION;
};

TDAnalytics.prototype.registerAnalyticsObserver = function (analyticsObserver) {
    if (!this._isCollectData()) {
        return;
    }
    if (typeof analyticsObserver === 'function') {
        this.observers.push(analyticsObserver);
    } else {
        Log.i('registerAnalyticsObserver parameter must be a function type');
    }
};

TDAnalytics.prototype.notifyAllObserver = function (type, obj) {
    for (let i = 0; i < this.observers.length; i++) {
        this.observers[i](type, obj);
    }
};

/**
 * Get a device ID: The #device_id value in the reported data.
 * @returns device ID
 */
TDAnalytics.prototype.getDeviceId = function () {
    return this['persistence'].getDeviceId();
};

TDAnalytics.prototype._isCollectData = function () {
    return this['persistence'].getOptTracking() && this['persistence'].getEnableTracking();
};

/**
 * Set public properties. Public properties will be persisted to localStorage or cookie if caching is supported.
 * @param {Object} superProperties public properties
 */
TDAnalytics.prototype.setSuperProperties = function (superProperties) {
    if (!this._isCollectData()) {
        return;
    }
    if (PropertyChecker.propertiesMust(superProperties) || !this._getConfig('strict')) {
        this['persistence'].setSuperProperties(_.extend({}, this.getSuperProperties(), superProperties));
    } else {
        Log.w('The paramater of setSuperProperties API requires object');
    }
};
/**
 * Gets the public event properties that have been set.
 * @returns super properties
 */
TDAnalytics.prototype.getSuperProperties = function () {
    return this['persistence'].getSuperProperties();
};
/**
 * Clear all public event attributes.
 */
TDAnalytics.prototype.clearSuperProperties = function () {
    if (!this._isCollectData()) {
        return;
    }
    this['persistence'].setSuperProperties({});
};
/**
 * Clears a public event attribute.
 * @param {String} propertyName Public event attribute key to clear
 */
TDAnalytics.prototype.unsetSuperProperty = function (propertyName) {
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
 * Set dynamic public properties. Dynamic public properties are only valid for the current page
 * @param {Function} dynamicProperties dynamic public properties
 */
TDAnalytics.prototype.setDynamicSuperProperties = function (dynamicProperties) {
    if (!this._isCollectData()) {
        return;
    }
    if (typeof dynamicProperties === 'function') {
        if (PropertyChecker.properties(dynamicProperties()) || !this._getConfig('strict')) {
            this.dynamicProperties = dynamicProperties;
        } else {
            Log.w('The return value of dynamic properties requires an object');
        }
    } else {
        Log.w('The paramater of setDynamicSuperProperties API requires function type');
    }
};

/**
 * Timing Event.
 * After calling this api, track eventName will add #duration to the attribute to indicate the duration, and the unit is second.
 * @param {String} eventName timing event name
 */
TDAnalytics.prototype.timeEvent = function (eventName) {
    if (!this._isCollectData()) {
        return;
    }
    if (_.check.isUndefined(eventName)) {
        Log.w('No event name provided to timeEvent');
        return;
    }
    this['persistence'].setEventTimer(eventName, _.getCurrentTimeStamp());
};

TDAnalytics.prototype.autoTrackSinglePage = function () {
    this['pageLifeCycle'].autoTrackSinglePage();
};

/**
 * track ta_pageview.
 * @param {String} type autoTrack or siteLinker
 * @param {Object} properties event properties
 */
TDAnalytics.prototype.quick = function (type, properties) {
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
            properties: _.extend(quickProperties, _.info.pageProperties(this._getConfig('disablePresetProperties')))
        });
    } else if (typeof type === 'string' && type === 'siteLinker') {
        siteLinker.init(this, properties);
    } else {
        Log.w('The quick method does not support the parameter of' + type);
    }
};

TDAnalytics.prototype._setConfig = function (config) {
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

TDAnalytics.prototype._getConfig = function (propName) {
    return this['config'][propName];
};

/**
 * SDK init
 * @param {Object} param init config
 */
TDAnalytics.prototype.init = function (param) {
    if (_.check.isUndefined(param.appId) || param.appId === '' || param.appId.replace(/\s*/g, '') === '') {
        return;
    }
    if (_.check.isUndefined(param.serverUrl) || param.serverUrl === '' || param.serverUrl.replace(/\s*/g, '') === '') {
        return;
    }
    if (_.check.isUndefined(this['config'])) {
        this['config'] = {};
        this.currentProps = this.currentProps || {};
        this._setConfig(_.extend({}, DEFAULT_CONFIG, param));
        this.observers = [];
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
        this._setConfig({
            originalUrl: _.url('basic', param.serverUrl.replace(/\s*/g, ''))
        });
        if (this._isDebug()) {
            this._setConfig({
                serverUrl: this._getConfig('originalUrl') + '/data_debug'
            });
        } else {
            this._setConfig({
                serverUrl: this._getConfig('originalUrl') + '/sync_js'
            });
        }
        //Whether to enable data batch sending
        if (this._getConfig('batch') !== undefined && this._getConfig('batch') !== false && _.localStorage.isSupported()) {
            this.batchConsumer = new BatchConsumer(this['config']);
            this.batchConsumer.batchInterval();
        }
        if(this._getConfig('accountId')){
            this.login(this._getConfig('accountId'));
        }
        if(this._getConfig('distinctId')){
            this.setDistinctId(this._getConfig('distinctId'));
        }
        if(this._getConfig('superProperties')){
            this.setSuperProperties(this._getConfig('superProperties'));
        }
        this['pageLifeCycle'] = new PageLifeCycle(this, this._getConfig('autoTrack'), this._getConfig('disablePresetProperties'));
        this['pageLifeCycle'].start();
        var m = 'normal';
        if (this.config.mode) {
            m = this.config.mode;
        }
        var xhr = null;
        if (window.XMLHttpRequest) {
            xhr = new XMLHttpRequest();
        } else {
            // eslint-disable-next-line no-undef
            xhr = new ActiveXObject('Microsoft.XMLHTTP');
        }
        var configUrl = `${this._getConfig('originalUrl')}/config?appid=${this.config.appId}`;
        xhr.open('GET', configUrl, true);
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                var configData = JSON.parse(xhr.responseText);
                Log.i('[ThinkingData] Info: TDAnalytics SDK config data: ');
                Log.i(configData);
                this._setConfig({
                    disableEventList: configData.data.disable_event_list,
                });
            } else {
                Log.e('TDAnalytics SDK config error code: ' + xhr.status);
            }
        };
        xhr.onerror = function () {
            Log.e('TDAnalytics SDK config network error');
        };
        xhr.send();
        Log.i('[ThinkingData] Info: TDAnalytics SDK initialize success, AppId = ' + this.config.appId + ', ServerUrl = ' + this.config.serverUrl + ', Mode = ' + m + ', DeviceId = ' + this.getDeviceId() + ', Lib = js, LibVersion = ' + Config.LIB_VERSION);
    } else {
        Log.i('The ThinkingData libraray has been initialized.');
    }
};

class PageLifeCycle {

    constructor(taLib, config, disableList) {
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
        if (_.paramType(config) === 'Object') {
            this.staticProperties = config.properties;
            this.callback = config.callback;
        }
        this.disableList = disableList;
        this.lastPageUrl = '';
        this.lastPagePath = '';
        this.title = '';
        this.isFirstRouter = true;
    }

    start() {
        var page = this;

        page.trackPageShowEvent();

        if ('onvisibilitychange' in document) {
            _.addEvent(document, 'visibilitychange', function () {
                if (document.hidden) {
                    //when the page hides, sending ta_page_hide event
                    page.trackPageHideEvent();
                } else {
                    //when the page shows, sending ta_page_show event
                    page.trackPageShowEvent();
                }
            });
        }
    }

    getPageProperties() {
        var properties = _.info.pageProperties(this.disableList);
        if (properties['#url'] !== null) {
            properties['#url'] = this.lastPageUrl;
        }
        if (properties['#url_path'] !== null) {
            properties['#url_path'] = this.lastPagePath;
        }
        if (properties['#title'] !== null) {
            properties['#title'] = this.title;
        }
        return properties;
    }

    autoTrackSinglePage() {
        if (this.isFirstRouter) {
            this.isFirstRouter = false;
            return;
        }
        if (this.autoPageHide) {
            this.taLib.trackWithBeacon('ta_page_hide', _.extend(this.getPageProperties(), this.staticProperties, _.isFunction(this.callback) ? this.callback('pageHide') : {}));
        }
        setTimeout(() => {
            this.trackPageShowEvent();
        }, 0);
    }

    trackPageShowEvent() {
        this.isFirstRouter = false;
        if (this.autoPageShow) {
            this.taLib.track('ta_page_show', _.extend(_.info.pageProperties(this.disableList), this.staticProperties, _.isFunction(this.callback) ? this.callback('pageShow') : {}));
            this.lastPageUrl = location.href;
            this.lastPagePath = location.pathname;
            this.title = document.title;
        }
        this.taLib.timeEvent('ta_page_hide');
    }

    trackPageHideEvent() {
        if (this.autoPageHide) {
            this.taLib.trackWithBeacon('ta_page_hide', _.extend(_.info.pageProperties(this.disableList), this.staticProperties, _.isFunction(this.callback) ? this.callback('pageHide') : {}));
        }
    }

    trackPageHideEventOnClose() {
        //If ta_page_hide is sent when the page is hidden, it does not need to be sent at this time
        if (this.autoPageHide && this.isPageShow) {
            this.taLib.trackWithBeacon('ta_page_hide', _.extend(_.info.pageProperties(this.disableList), this.staticProperties, _.isFunction(this.callback) ? this.callback('pageHide') : {}));
        }
    }

}

/**
 * create another instance
 * @param {String} name instance name，string Type required
 * @param {Object} param optional
 * The child instance shares the pageProperty and device id with the main instance. The initial value of distinct_id is device id.
 * The child instance inherits the configuration information from the main instance, and does not use the local cache by default. If you need to use the local cache, just specify it in param persistenceEnabled: true
 * Note: Sub-instances with the same name will share the cache name.
 *
 */
TDAnalytics.prototype.initInstance = function (name, param) {
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

    var instance = new TDAnalytics();
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

TDAnalytics.prototype.enableTracking = function (enabled) {
    if (typeof enabled === 'boolean') {
        this['persistence'].setEnableTracking(enabled);
    }
};

TDAnalytics.prototype.optOutTracking = function () {
    this['persistence'].setSuperProperties({});
    this['persistence'].setAccountId('');
    this['persistence'].clearEventTimer();
    this['persistence'].setOptTracking(false);
};

TDAnalytics.prototype.optInTracking = function () {
    this['persistence'].setOptTracking(true);
};
/**
 * Switch reporting status
 * @param {Object} config track status
 */
TDAnalytics.prototype.setTrackStatus = function (config) {
    if (_.check.isObject(config)) {
        var status = config['status'];
        Log.i('[ThinkingData] Info: Change Status to ' + status);
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
        this.ta.setDistinctId(urlId);
    }
};
siteLinker.init = function (ta, option) {
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
                Log.w('The configuration of linker ' + (i + 1) + ' is not supported.Please check format');
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
        var instance = new TDAnalytics();
        instance.init(tdMaster.param);

        // create light instance
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
    tdMaster = new TDAnalytics();
    return tdMaster;
}
