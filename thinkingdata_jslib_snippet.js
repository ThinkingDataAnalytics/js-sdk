/* eslint-disable camelcase */
(function (param) {
    var TD_LIB_NAME = 'ThinkingDataAnalyticalTool';
    if (window[TD_LIB_NAME]) return;
    var p = param.sdkUrl,
        n = param.name,
        w = window,
        d = document,
        s = 'script',
        x = null,
        y = null;
    w[TD_LIB_NAME] = n;
    var methods = ['track', 'quick', 'login', 'identify','setDistinctId', 'logout', 'trackLink', 'userSet', 'userSetOnce',
        'userAdd', 'userDel','userDelete','setPageProperty', 'setSuperProperties', 'setDynamicSuperProperties', 'clearSuperProperties',
        'timeEvent', 'unsetSuperProperty', 'initInstance','userUnset','userAppend','userUniqAppend','flush','trackUpdate','trackOverwrite','trackFirstEvent',
        'trackFirst','trackWithBeacon','getDistinctId','getDeviceId','getSuperProperties','setTrackStatus'
    ];
    w[n] = function (a) {
        return function () {
            if (this.name) {
                (w[n]._q = w[n]._q || [])
                    .push([a, arguments, this.name]);
            } else {
                if (a === 'initInstance') {
                    var instance = arguments[0];
                    w[n][instance] = {
                        name: instance
                    };
                    for (var i = 0; i < methods.length; i++) {
                        w[n][instance][methods[i]] = w[n].call(w[n][instance], methods[i]);
                    }
                    (w[n]._q1 = w[n]._q1 || [])
                        .push([a, arguments]);
                } else {
                    (w[n]._q = w[n]._q || [])
                        .push([a, arguments]);
                }
            }
        };
    };
    for (var i = 0; i < methods.length; i++) {
        w[n][methods[i]] = w[n].call(null, methods[i]);
    }
    w[n].param = param;
    w[n].__SV = 1.1;
    x = d.createElement(s), y = d.getElementsByTagName(s)[0];
    x.async = 1;
    x.src = p;
    y.parentNode.insertBefore(x, y);
})({YOUR_CONFIG});
