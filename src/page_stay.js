import {
    _
} from './utils';

function pageEndTrack() {
    var time = +new Date();
    if (isPageShow === false) {
        pageLeaveTime = time - pageHiddenTime + pageLeaveTime;
    }
    var pageStay = Number(time - pageStartTime - pageLeaveTime);
    if (pageStay < 0) {
        pageStay = Number(time - pageStartTime);
    }
    if (typeof libName === 'undefined') {
        window.thinkingdata.trackWithBeacon('ta_page_close', {
            stayTime: pageStay,
            url: url,
            title: pageTitle
        });
    } else {
        window[libName].trackWithBeacon('ta_page_close', {
            stayTime: pageStay,
            url: url,
            title: pageTitle
        });
    }
    createTime();
}

function pageStayInit(obj, name) {
    if (_.paramType(obj) === 'Object' && _.paramType(obj.autoPageClose) === 'Boolean') {
        autoPageClose = obj.autoPageClose;
        libName = name;
        createTime();
    }
}

function getUrl() {
    var url = window.location.href;
    try {
        url = decodeURIComponent(url);
    } catch (e) {
        console.log('Failed to get url');
    }
    return url;
}

var pageOpenTime = +new Date();
var pageStartTime = pageOpenTime;
var pageHiddenTime = pageOpenTime;
var pageLeaveTime = 0;
var isPageShow = true;
var url = getUrl();
var pageTitle = document.title;
var autoPageClose = false;
var libName;

function createTime(startTime, title) {
    var time = +new Date();
    pageStartTime = startTime || time;
    pageHiddenTime = startTime || time;
    pageLeaveTime = 0;
    isPageShow = true;
    url = getUrl();
    pageTitle = arguments.length > 1 ? title : document.title;
}

if ('onpageShow' in window) {
    _.addEvent(window, 'pageShow', function () {
        pageStartTime = pageHiddenTime = +new Date();
    });
    _.addEvent(window, 'pagehide', function () {
        if (autoPageClose === true) {
            pageEndTrack();
        }
    });
} else {
    _.addEvent(window, 'load', function () {
        pageStartTime = pageHiddenTime = +new Date();
    });
    _.addEvent(window, 'beforeunload', function () {
        if (autoPageClose === true) {
            pageEndTrack();
        }
    });
}

if ('onvisibilitychange' in document) {
    _.addEvent(document, 'visibilitychange', function () {
        if (document.hidden) {
            isPageShow = false;
            pageHiddenTime = +new Date();
        } else {
            isPageShow = true;
            pageLeaveTime = +new Date() - pageHiddenTime + pageLeaveTime;
        }
    });
}

export default pageStayInit;
