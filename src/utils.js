/* eslint-disable no-cond-assign */
/* eslint-disable no-useless-escape */
import Config from './config';

/** @const */ var MAX_REFERRER_STRING_LENGTH = 200;

var ArrayProto = Array.prototype;
var ObjProto = Object.prototype;
var slice = ArrayProto.slice;
var toString = ObjProto.toString;
var hasOwnProperty = ObjProto.hasOwnProperty;
var nativeForEach = ArrayProto.forEach; var breaker = {};
var utmTypes = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

var _ = {};

/**
 * @param {*=} obj
 * @param {function(...*)=} iterator
 * @param {Object=} context
 */
_.each = function (obj, iterator, context) {
    if (obj === null) {
        return;
    }
    if (nativeForEach && obj.forEach === nativeForEach) {
        obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
        for (var i = 0, l = obj.length; i < l; i++) {
            if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) {
                return;
            }
        }
    } else {
        for (var key in obj) {
            if (hasOwnProperty.call(obj, key)) {
                if (iterator.call(context, obj[key], key, obj) === breaker) {
                    return;
                }
            }
        }
    }
};

_.extend = function (obj) {
    _.each(slice.call(arguments, 1), function (source) {
        for (var prop in source) {
            if (source[prop] !== void 0) {
                obj[prop] = source[prop];
            }
        }
    });
    return obj;
};


_.formatDate = function (d) {
    function pad(n) {
        return n < 10 ? '0' + n : n;
    }
    function padMilliseconds(n) {
        if (n < 10) {
            return '00' + n;
        } else if (n < 100) {
            return '0' + n;
        } else {
            return n;
        }
    }
    return d.getFullYear() + '-' +
        pad(d.getMonth() + 1) + '-' +
        pad(d.getDate()) + ' ' +
        pad(d.getHours()) + ':' +
        pad(d.getMinutes()) + ':' +
        pad(d.getSeconds()) + '.' +
        padMilliseconds(d.getMilliseconds());
};

_.formatTimeZone = function (d, i) {
    if (typeof i !== 'number') return d;
    var len = d.getTime();
    var offset = d.getTimezoneOffset() * 60000;
    var utcTime = len + offset;
    return new Date(utcTime + 3600000 * i);
};

_.formatJsonString = function (obj) {
    try {
        return JSON.stringify(obj, null, 8);
    } catch (e) {
        return JSON.stringify(obj);
    }
};

_.searchObjDate = function (o, i) {
    if (_.check.isObject(o) || _.check.isArray(o)) {
        _.each(o, function (a, b) {
            if (_.check.isObject(a) || _.check.isArray(a)) {
                _.searchObjDate(o[b], i);
            } else {
                if (_.check.isDate(a)) {
                    o[b] = _.formatDate(_.formatTimeZone(a, i));
                }
            }
        });
    }
};

_.check = {
    isUndefined: function (obj) {
        return obj === void 0;
    },

    isObject: function (obj) {
        return (toString.call(obj) === '[object Object]') && (obj !== null);
    },

    isEmptyObject: function (obj) {
        if (_.check.isObject(obj)) {
            for (var key in obj) {
                if (hasOwnProperty.call(obj, key)) {
                    return false;
                }
            }
            return true;
        }
        return false;
    },

    isArray: function (obj) {
        return toString.call(obj) === '[object Array]';
    },

    isString: function (obj) {
        return toString.call(obj) === '[object String]';
    },

    isDate: function (obj) {
        return toString.call(obj) === '[object Date]';
    },

    isNumber: function (obj) {
        return toString.call(obj) === '[object Number]';
    },

    isBoolean: function (obj) {
        return toString.call(obj) === '[object Boolean]';
    },

    isJSONString: function (str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }
};

_.UUID = (function () {
    var T = function () {
        var d = 1 * new Date();
        var i = 0;
        while (d === 1 * new Date()) {
            i++;
        }
        return d.toString(16) + i.toString(16);
    };
    var R = function () {
        return Math.random().toString(16).replace('.', '');
    };
    var UA = function () {
        var ua = navigator.userAgent;
        var i;
        var ch;
        var buffer = [];
        var ret = 0;
        function xor(result, byteArray) {
            var j;
            var tmp = 0;
            for (j = 0; j < byteArray.length; j++) {
                tmp |= (buffer[j] << j * 8);
            }
            return result ^ tmp;
        }
        for (i = 0; i < ua.length; i++) {
            ch = ua.charCodeAt(i);
            buffer.unshift(ch & 0xFF);
            if (buffer.length >= 4) {
                ret = xor(ret, buffer);
                buffer = [];
            }
        }
        if (buffer.length > 0) {
            ret = xor(ret, buffer);
        }
        return ret.toString(16);
    };
    return function () {
        var se = String(screen.height * screen.width);
        if (se && /\d{5,}/.test(se)) {
            se = se.toString(16);
        } else {
            se = String(Math.random() * 31242).replace('.', '').slice(0, 8);
        }
        var val = (T() + '-' + R() + '-' + UA() + '-' + se + '-' + T());
        if (val) {
            return val;
        } else {
            return (String(Math.random()) + String(Math.random()) + String(Math.random())).slice(2, 15);
        }
    };
})();

_.UUIDv4 = function () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            // eslint-disable-next-line eqeqeq
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

_.getReferrer = function (targetReferrer) {
    var referrer = targetReferrer || document.referrer;
    if (typeof referrer !== 'string') {
        return 'referrer exception' + String(referrer);
    }
    if (referrer.indexOf('https://www.baidu.com/') === 0) {
        referrer = referrer.split('?')[0];
    }
    referrer = referrer.slice(0, MAX_REFERRER_STRING_LENGTH);
    return (typeof referrer === 'string' ? referrer : '');
};

_.url = (function () {
    function _t() {
        return new RegExp(/(.*?)\.?([^\.]*?)\.(com|net|org|biz|ws|in|me|co\.uk|co|org\.uk|ltd\.uk|plc\.uk|me\.uk|edu|mil|br\.com|cn\.com|eu\.com|hu\.com|no\.com|qc\.com|sa\.com|se\.com|se\.net|us\.com|uy\.com|ac|co\.ac|gv\.ac|or\.ac|ac\.ac|af|am|as|at|ac\.at|co\.at|gv\.at|or\.at|asn\.au|com\.au|edu\.au|org\.au|net\.au|id\.au|be|ac\.be|adm\.br|adv\.br|am\.br|arq\.br|art\.br|bio\.br|cng\.br|cnt\.br|com\.br|ecn\.br|eng\.br|esp\.br|etc\.br|eti\.br|fm\.br|fot\.br|fst\.br|g12\.br|gov\.br|ind\.br|inf\.br|jor\.br|lel\.br|med\.br|mil\.br|net\.br|nom\.br|ntr\.br|odo\.br|org\.br|ppg\.br|pro\.br|psc\.br|psi\.br|rec\.br|slg\.br|tmp\.br|tur\.br|tv\.br|vet\.br|zlg\.br|br|ab\.ca|bc\.ca|mb\.ca|nb\.ca|nf\.ca|ns\.ca|nt\.ca|on\.ca|pe\.ca|qc\.ca|sk\.ca|yk\.ca|ca|cc|ac\.cn|net\.cn|com\.cn|edu\.cn|gov\.cn|org\.cn|bj\.cn|sh\.cn|tj\.cn|cq\.cn|he\.cn|nm\.cn|ln\.cn|jl\.cn|hl\.cn|js\.cn|zj\.cn|ah\.cn|gd\.cn|gx\.cn|hi\.cn|sc\.cn|gz\.cn|yn\.cn|xz\.cn|sn\.cn|gs\.cn|qh\.cn|nx\.cn|xj\.cn|tw\.cn|hk\.cn|mo\.cn|cn|cx|cz|de|dk|fo|com\.ec|tm\.fr|com\.fr|asso\.fr|presse\.fr|fr|gf|gs|co\.il|net\.il|ac\.il|k12\.il|gov\.il|muni\.il|ac\.in|co\.in|org\.in|ernet\.in|gov\.in|net\.in|res\.in|is|it|ac\.jp|co\.jp|go\.jp|or\.jp|ne\.jp|ac\.kr|co\.kr|go\.kr|ne\.kr|nm\.kr|or\.kr|li|lt|lu|asso\.mc|tm\.mc|com\.mm|org\.mm|net\.mm|edu\.mm|gov\.mm|ms|nl|no|nu|pl|ro|org\.ro|store\.ro|tm\.ro|firm\.ro|www\.ro|arts\.ro|rec\.ro|info\.ro|nom\.ro|nt\.ro|se|si|com\.sg|org\.sg|net\.sg|gov\.sg|sk|st|tf|ac\.th|co\.th|go\.th|mi\.th|net\.th|or\.th|tm|to|com\.tr|edu\.tr|gov\.tr|k12\.tr|net\.tr|org\.tr|com\.tw|org\.tw|net\.tw|ac\.uk|uk\.com|uk\.net|gb\.com|gb\.net|vg|sh|kz|ch|info|ua|gov|name|pro|ie|hk|com\.hk|org\.hk|net\.hk|edu\.hk|us|tk|cd|by|ad|lv|eu\.lv|bz|es|jp|cl|ag|mobi|eu|co\.nz|org\.nz|net\.nz|maori\.nz|iwi\.nz|io|la|md|sc|sg|vc|tw|travel|my|se|tv|pt|com\.pt|edu\.pt|asia|fi|com\.ve|net\.ve|fi|org\.ve|web\.ve|info\.ve|co\.ve|tel|im|gr|ru|net\.ru|org\.ru|hr|com\.hr|ly|xyz)$/);
    }

    function _d(s) {
        return _.decodeURIComponent(s.replace(/\+/g, ' '));
    }

    function _i(arg, str) {
        var sptr = arg.charAt(0);
        var split = str.split(sptr);
        if (sptr === arg) { return split; }
        arg = parseInt(arg.substring(1), 10);
        return split[arg < 0 ? split.length + arg : arg - 1];
    }

    function _f(arg, str) {
        var sptr = arg.charAt(0);
        var split = str.split('&');
        var field = [];
        var params = {};
        var tmp = [];
        var arg2 = arg.substring(1);

        for (var i = 0, ii = split.length; i < ii; i++) {
            field = split[i].match(/(.*?)=(.*)/);
            // TODO: regex should be able to handle this.
            if (!field) {
                field = [split[i], split[i], ''];
            }
            if (field[1].replace(/\s/g, '') !== '') {
                field[2] = _d(field[2] || '');
                // If we have a match just return it right away.
                if (arg2 === field[1]) { return field[2]; }
                // Check for array pattern.
                tmp = field[1].match(/(.*)\[([0-9]+)\]/);
                if (tmp) {
                    params[tmp[1]] = params[tmp[1]] || [];
                    params[tmp[1]][tmp[2]] = field[2];
                } else {
                    params[field[1]] = field[2];
                }
            }
        }
        if (sptr === arg) { return params; }
        return params[arg2];
    }

    return function (arg, url) {
        var _l = {}, tmp;
        if (arg === 'tld?') { return _t(); }
        url = url || window.location.toString();
        if (!arg) { return url; }
        arg = arg.toString();
        if (tmp = url.match(/^mailto:([^\/].+)/)) {
            _l.protocol = 'mailto';
            _l.email = tmp[1];
        } else {
            // Ignore Hashbangs.
            if (tmp = url.match(/(.*?)\/#\!(.*)/)) {
                url = tmp[1] + tmp[2];
            }
            // Hash.
            if (tmp = url.match(/(.*?)#(.*)/)) {
                _l.hash = tmp[2];
                url = tmp[1];
            }
            // Return hash parts.
            if (_l.hash && arg.match(/^#/)) { return _f(arg, _l.hash); }
            // Query
            if (tmp = url.match(/(.*?)\?(.*)/)) {
                _l.query = tmp[2];
                url = tmp[1];
            }
            // Return query parts.
            if (_l.query && arg.match(/^\?/)) { return _f(arg, _l.query); }
            // Protocol.
            if (tmp = url.match(/(.*?)\:?\/\/(.*)/)) {
                _l.protocol = tmp[1].toLowerCase();
                url = tmp[2];
            }
            // Path.
            if (tmp = url.match(/(.*?)(\/.*)/)) {
                _l.path = tmp[2];
                url = tmp[1];
            }
            // Clean up path.
            _l.path = (_l.path || '').replace(/^([^\/])/, '/$1').replace(/\/$/, '');
            // Return path parts.
            if (arg.match(/^[\-0-9]+$/)) { arg = arg.replace(/^([^\/])/, '/$1'); }
            if (arg.match(/^\//)) { return _i(arg, _l.path.substring(1)); }
            // File.
            tmp = _i('/-1', _l.path.substring(1));
            if (tmp && (tmp = tmp.match(/(.*?)\.(.*)/))) {
                _l.file = tmp[0];
                _l.filename = tmp[1];
                _l.fileext = tmp[2];
            }
            // Port.
            if (tmp = url.match(/(.*)\:([0-9]+)$/)) {
                _l.port = tmp[2];
                url = tmp[1];
            }
            // Auth.
            if (tmp = url.match(/(.*?)@(.*)/)) {
                _l.auth = tmp[1];
                url = tmp[2];
            }
            // User and pass.
            if (_l.auth) {
                tmp = _l.auth.match(/(.*)\:(.*)/);

                _l.user = tmp ? tmp[1] : _l.auth;
                _l.pass = tmp ? tmp[2] : undefined;
            }
            // Hostname.
            _l.hostname = url.toLowerCase();
            // Return hostname parts.
            if (arg.charAt(0) === '.') { return _i(arg, _l.hostname); }
            // Domain, tld and sub domain.
            if (_t()) {
                tmp = _l.hostname.match(_t());
                if (tmp) {
                    _l.tld = tmp[3];
                    _l.domain = tmp[2] ? tmp[2] + '.' + tmp[3] : undefined;
                    _l.sub = tmp[1] || undefined;
                }
            }
            // Set port and protocol defaults if not set.
            var portInfo = _l.port ? ':' + _l.port : '';
            _l.protocol = _l.protocol || (window.location.protocol.replace(':', ''));
            _l.port = _l.port || (_l.protocol === 'https' ? '443' : '80');
            _l.protocol = _l.protocol || (_l.port === '443' ? 'https' : 'http');
            _l.basic = _l.protocol + '://' + _l.hostname + portInfo;
        }
        // Return arg.
        if (arg in _l) { return _l[arg]; }
        // Return everything.
        if (arg === '{}') { return _l; }
        // Default to undefined for no match.
        return '';
    };
})();

_.hashCode = function (str) {
    if (typeof str !== 'string') {
        return 0;
    }
    var hash = 0;
    var char = null;
    if (str.length === 0) {
        return hash;
    }
    for (var i = 0; i < str.length; i++) {
        char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash;
};

_.decodeURIComponent = function (val) {
    var result = '';
    try {
        result = decodeURIComponent(val);
    } catch (e) {
        result = val;
    }
    return result;
};

_.encodeURIComponent = function (val) {
    var result = '';
    try {
        result = encodeURIComponent(val);
    } catch (e) {
        result = val;
    }
    return result;
};

_.utf8Encode = function (string) {
    string = (string + '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    var utftext = '';
    var start, end;
    var stringl = 0;
    var n;
    start = end = 0;
    stringl = string.length;
    for (n = 0; n < stringl; n++) {
        var c1 = string.charCodeAt(n);
        var enc = null;
        if (c1 < 128) {
            end++;
        } else if ((c1 > 127) && (c1 < 2048)) {
            enc = String.fromCharCode((c1 >> 6) | 192, (c1 & 63) | 128);
        } else {
            enc = String.fromCharCode((c1 >> 12) | 224, ((c1 >> 6) & 63) | 128, (c1 & 63) | 128);
        }
        if (enc !== null) {
            if (end > start) {
                utftext += string.substring(start, end);
            }
            utftext += enc;
            start = end = n + 1;
        }
    }
    if (end > start) {
        utftext += string.substring(start, string.length);
    }
    return utftext;
};

_.base64Encode = function (data) {
    var b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    var o1, o2, o3, h1, h2, h3, h4, bits;
    var i = 0, ac = 0, enc = '', tmpArr = [];

    if (!data) {
        return data;
    }

    data = _.utf8Encode(data);
    do {
        o1 = data.charCodeAt(i++);
        o2 = data.charCodeAt(i++);
        o3 = data.charCodeAt(i++);
        bits = o1 << 16 | o2 << 8 | o3;
        h1 = bits >> 18 & 0x3f;
        h2 = bits >> 12 & 0x3f;
        h3 = bits >> 6 & 0x3f;
        h4 = bits & 0x3f;
        tmpArr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
    } while (i < data.length);

    enc = tmpArr.join('');
    switch (data.length % 3) {
        case 1:
            enc = enc.slice(0, -2) + '==';
            break;
        case 2:
            enc = enc.slice(0, -1) + '=';
            break;
    }
    return enc;
};

_.cookie = {
    get: function (name) {
        var nameEQ = name + '=';
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1, c.length);
            }
            if (c.indexOf(nameEQ) === 0) {
                return _.decodeURIComponent(c.substring(nameEQ.length, c.length));
            }
        }
        return null;
    },

    set: function (name, value, days, crossSubDomain, isSecure) {
        var cDomain = '', expires = '', secure = '';

        days = days === null ? 73000 : days;

        if (crossSubDomain) {
            var domain = _.url('domain', location.href);
            cDomain = ((domain) ? '; domain=.' + domain : '');
        }

        if (days) {
            var date = new Date();
            if (String(days).slice(-1) === 's') {
                date.setTime(date.getTime() + (Number(String(days).slice(0, -1)) * 1000));
            } else {
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            }
            expires = '; expires=' + date.toGMTString();
        }

        if (isSecure) {
            secure = '; secure';
        }

        var newCookieValue = name + '=' + encodeURIComponent(value) + expires + '; path=/' + cDomain + secure;
        document.cookie = newCookieValue;
        return newCookieValue;
    },

    remove: function (name, crossSubDomain) {
        _.cookie.set(name, '', -1, crossSubDomain);
    },

};

_.localStorage = {
    get: function (name) {
        try {
            return window.localStorage.getItem(name);
        } catch (err) {
            _.localStorage.error(err);
        }
    },

    parse: function (name) {
        var storedValue;
        try {
            storedValue = JSON.parse(_.localStorage.get(name)) || null;
        } catch (err) {
            _.localStorage.error(err);
        }
        return storedValue;
    },

    set: function (name, value) {
        try {
            window.localStorage.setItem(name, value);
        } catch (err) {
            _.localStorage.error(err);
        }
    },

    remove: function (name) {
        try {
            window.localStorage.removeItem(name);
        } catch (err) {
            _.localStorage.error(err);
        }
    },

    error: function (msg) {
        console.error('localStorage error: ' + msg);
    },

    isSupported: function () {
        var supported = true;
        try {
            var key = '__thinkingdatasupport__';
            var val = 'testIsSupportStorage';
            _.localStorage.set(key, val);
            if (_.localStorage.get(key) !== val) {
                supported = false;
            }
            _.localStorage.remove(key);
        } catch (err) {
            supported = false;
        }
        return supported;
    }
};

_.stripEmptyProperties = function (p) {
    var ret = {};
    _.each(p, function (v, k) {
        if (_.check.isString(v) && v.length > 0) {
            ret[k] = v;
        }
    });
    return ret;
};


_.info = {
    os: function () {
        var a = navigator.userAgent;
        if (/Windows/i.test(a)) {
            if (/Phone/.test(a) || /WPDesktop/.test(a)) {
                return 'Windows Phone';
            }
            return 'Windows';
        } else if (/(iPhone|iPad|iPod)/.test(a)) {
            return 'iOS';
        } else if (/Android/.test(a)) {
            return 'Android';
        } else if (/(BlackBerry|PlayBook|BB10)/i.test(a)) {
            return 'BlackBerry';
        } else if (/Mac/i.test(a)) {
            return 'Mac OS X';
        } else if (/Linux/.test(a)) {
            return 'Linux';
        } else if (/CrOS/.test(a)) {
            return 'Chrome OS';
        } else {
            return '';
        }
    },

    browser: function () {
        var browser = { type: '', version: '' };
        try {
            var ua = navigator.userAgent.toLowerCase();
            var versionMatch = [];
            if (ua.match(/baidubrowser/) !== null) {
                browser['type'] = 'baidu';
                versionMatch.push(/baidubrowser\/([\d.]+)/);
            } else if (ua.match(/bidubrowser/) !== null) {
                browser['type'] = 'baidu';
                versionMatch.push(/bidubrowser\/([\d.]+)/);
            } else if (ua.match(/edga/) !== null) {
                browser['type'] = 'edge';
                versionMatch.push(/edga\/([\d.]+)/);
            } else if (ua.match(/edgios/) !== null) {
                browser['type'] = 'edge';
                versionMatch.push(/edgios\/([\d.]+)/);
            } else if (ua.match(/liebaofast/) !== null) {
                browser['type'] = 'liebao';
                versionMatch.push(/liebaofast\/([\d.]+)/);
            } else if (ua.match(/sogoumobilebrowser/) !== null) {
                browser['type'] = 'sogou';
                versionMatch.push(/sogoumobilebrowser\/([\d.]+)/);
            } else if (ua.match(/lbbrowser/) !== null) {
                browser['type'] = 'liebao';
                versionMatch.push(/lbbrowser\/([\d.]+)/);
            } else if (ua.match(/crios/) !== null) {
                browser['type'] = 'chrome';
                versionMatch.push(/crios\/([\d.]+)/);
            } else if (ua.match(/qihoobrowser/) !== null) {
                browser['type'] = '360';
                versionMatch.push(/qihoobrowser\/([\d.]+)/);
            } else if (ua.match(/mxios/) !== null) {
                browser['type'] = 'maxthon';
                versionMatch.push(/mxios\/([\d.]+)/);
            } else if (ua.match(/fxios/) !== null) {
                browser['type'] = 'firefox';
                versionMatch.push(/fxios\/([\d.\w]+)/);
            } else if (ua.match(/edge/) !== null) {
                browser['type'] = 'edge';
                versionMatch.push(/edge\/([\d.]+)/);
            } else if (ua.match(/metasr/) !== null) {
                browser['type'] = 'sogou';
                versionMatch.push(/metasr ([\d.]+)/);
            } else if (ua.match(/micromessenger/) !== null) {
                browser['type'] = 'micromessenger';
                versionMatch.push(/micromessenger\/([\d.]+)/);
            } else if (ua.match(/mqqbrowser/) !== null) {
                browser['type'] = 'qq';
                versionMatch.push(/mqqbrowser\/([\d.]+)/);
            } else if (ua.match(/qqbrowserlite/) !== null) {
                browser['type'] = 'qq';
                versionMatch.push(/qqbrowserlite\/([\d.]+)/);
            } else if (ua.match(/tencenttraveler/) !== null) {
                browser['type'] = 'qq';
                versionMatch.push(/tencenttraveler\/([\d.]+)/);
            } else if (ua.match(/qqbrowser/) !== null) {
                browser['type'] = 'qq';
                versionMatch.push(/qqbrowser\/([\d.]+)/);
            } else if (ua.match(/maxthon/) !== null) {
                browser['type'] = 'maxthon';
                versionMatch.push(/maxthon\/([\d.]+)/);
            } else if (ua.match(/ubrowser/) !== null) {
                browser['type'] = 'uc';
                versionMatch.push(/ubrowser\/([\d.]+)/);
            } else if (ua.match(/ucbrowser/) !== null) {
                browser['type'] = 'uc';
                versionMatch.push(/ucbrowser\/([\d.]+)/);
            } else if (ua.match(/firefox/) !== null) {
                browser['type'] = 'firefox';
                versionMatch.push(/firefox\/([\d.]+)/);
            } else if (ua.match(/opera/) !== null) {
                browser['type'] = 'opera';
                versionMatch.push(/opera\/([\d.]+)/);
            } else if (ua.match(/opr/) !== null) {
                browser['type'] = 'opera';
                versionMatch.push(/opr\/([\d.]+)/);
            } else if (ua.match(/chrome/) !== null) {
                browser['type'] = 'chrome';
                versionMatch.push(/chrome\/([\d.]+)/);
            } else if (ua.match(/safari/) !== null) {
                browser['type'] = 'safari';
                versionMatch.push(/version\/([\d.]+)/);
            } else if (ua.match(/trident/) !== null || ua.match(/msie/) !== null) {
                browser['type'] = 'ie';
            }

            if (browser['type'] === 'ie') {
                var tridentVersion = ua.match(/trident\/([\d.]+)/) ? ua.match(/trident\/([\d.]+)/)[1] : '';
                var msieVersion = ua.match(/msie ([\d.]+)/) ? ua.match(/msie ([\d.]+)/)[1] : '';

                if (tridentVersion !== '') {
                    browser['version'] = String(parseInt(tridentVersion) + 4);
                } else if (msieVersion !== '') {
                    browser['version'] = msieVersion;
                }
            } else if (versionMatch) {
                browser['version'] = ua.match(versionMatch[0]) ? ua.match(versionMatch[0])[1] : '';
            }
        } catch (e) {
            Log.w('getting browser info failed due to ', e);
        }
        return browser;
    },
    properties: function () {
        var browserInfo = _.info.browser();
        return _.extend({
            '#os': _.info.os(),
            '#lib_version': Config.LIB_VERSION,
            '#lib': 'js',
            '#screen_height': screen.height,
            '#screen_width': screen.width,
            '#browser': browserInfo.type,
            '#browser_version': browserInfo.version,
            '#system_language': _.check.isString(navigator.languages[1]) ? navigator.languages[1].toLowerCase() : 'Value exception',
            '#ua': _.check.isString(navigator.userAgent) ? navigator.userAgent.toLowerCase() : 'Value exception',
            '#utm': _.getUtm()
        });
    },
    pageProperties: function () {
        var referrer = _.getReferrer();
        return _.stripEmptyProperties({
            '#referrer': referrer,
            '#referrer_host': referrer ? _.url('hostname', referrer) : referrer,
            '#url': location.href,
            '#url_path': location.pathname,
            '#title': document.title
        });
    }
};

_.getUtm = function () {
    var params = {};
    _.each(utmTypes, function (kwkey) {
        var kw = _.getQueryParam(location.href, kwkey);
        if (kw.length) {
            params[kwkey] = kw;
        }
    });
    return JSON.stringify(params);
};

_.getQueryParam = function (url, key) {
    key = key.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    url = _.decodeURIComponent(url);
    var regexS = '[\\?&]' + key + '=([^&#]*)',
        regex = new RegExp(regexS),
        results = regex.exec(url);
    if (results === null || (results && typeof results[1] !== 'string' && results[1].length)) {
        return '';
    } else {
        return _.decodeURIComponent(results[1]);
    }
};


_.createString = function (length) {
    var expect = length;
    var str = Math.random().toString(36).substr(2);
    while (str.length < expect) {
        str += Math.random().toString(36).substr(2);
    }
    str = str.substr(0, length);
    return str;
};

_.createAesKey = function () {
    return _.createString(16);
};

_.generateEncryptyData = function (text, secretKey) {

    if (typeof secretKey === 'undefined') {
        return text;
    }

    var pkey = secretKey['publicKey'];
    var v = secretKey['version'];

    if (typeof pkey === 'undefined' || typeof v === 'undefined') {
        return text;
    }

    if (typeof CryptoJS === 'undefined' || typeof JSEncrypt === 'undefined') {
        return text;
    }
    var strKey = _.createAesKey();
    try {
        var key = CryptoJS.enc.Utf8.parse(strKey);
        var data = CryptoJS.enc.Utf8.parse(JSON.stringify(text));
        var aesStr = CryptoJS.AES.encrypt(data, key, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }).toString();
        var encrypt = new JSEncrypt();
        encrypt.setPublicKey(pkey);
        var rsaStr = encrypt.encrypt(strKey);
        if (rsaStr === false) {
            Log.w('encryption failed');
            return text;
        }
        return {
            pkv: v,
            ekey: rsaStr,
            payload: aesStr
        };
    } catch (e) {
        Log.w('encryption failed');
    }
    return text;
};

_.paramType = function (param) {
    return Object.prototype.toString.call(param).replace('[object ', '').replace(']', '');
};
_.addEvent = function (el, type, fn, useCapture) {
    if (document.addEventListener) {
        if ((this.paramType(el) === 'Array' || this.paramType(el) === 'HTMLCollection') && el.length && el !== window) {
            for (var i = 0; i < el.length; i++) {
                this.addEvent(el[i], type, fn, useCapture);
            }
        } else {
            el.addEventListener(type, fn, useCapture);
        }
    } else {
        if (el.length && el !== window) {
            for (var index = 0; index < el.length; index++) {
                this.addEvent(el[index], type, fn);
            }
        } else {
            el.attachEvent('on' + type, function () {
                return fn.call(el, window.event);
            });
        }
    }
};

_.getRandom = function () {
    var today = new Date();
    var seed = today.getTime();
    var num = Math.floor(Math.random() * 1000000);
    return seed + '_' + num;
};
_.safeJSONParse = function (str) {
    var val = null;
    try {
        val = JSON.parse(str);
    } catch (e) {
        return str;
    }
    return val;
};
_.saveObjectVal = function (name, value) {
    if (!_.check.isString(value)) {
        value = JSON.stringify(value);
    }
    _.localStorage.set(name, value);
};
_.readObjectVal = function (name) {
    var value = _.localStorage.get(name);
    if (!value) return null;
    return _.safeJSONParse(value);
};

_.indexOf = function (arr, target) {
    var indexof = arr.indexOf;
    if (indexof) {
        return indexof.call(arr, target);
    } else {
        for (var i = 0; i < arr.length; i++) {
            if (target === arr[i]) {
                return i;
            }
        }
        return -1;
    }
};

_.hasEncrypty = function (obj) {
    if (_.check.isObject()) {
        return obj.pkv !== 'undefined' && obj.ekey !== 'undefined' && obj.payload !== 'undefined';
    }
    return false;
};

_.addSiteEvent = function (target, eventName, eventHandler, useCapture) {
    function fixEvent(event) {
        if (event) {
            event.preventDefault = fixEvent.preventDefault;
            event.stopPropagation = fixEvent.stopPropagation;
            event._getPath = fixEvent._getPath;
        }
        return event;
    }
    fixEvent._getPath = function () {
        var ev = this;
        return this.path || (this.composedPath && this.composedPath()) || ry(ev.target).getParents();
    };

    function ry(dom) {
        return new DomElementInfo(dom);
    }

    var DomElementInfo = function (dom) {
        this.ele = dom;
    };

    fixEvent.preventDefault = function () {
        this.returnValue = false;
    };
    fixEvent.stopPropagation = function () {
        this.cancelBubble = true;
    };

    var registerEvent = function (element, type, handler) {
        if (useCapture === undefined && type === 'click') {
            useCapture = true;
        }
        if (element && element.addEventListener) {
            element.addEventListener(
                type,
                function (e) {
                    e._getPath = fixEvent._getPath;
                    handler.call(this, e);
                },
                useCapture
            );
        } else {
            var ontype = 'on' + type;
            var oldHandler = element[ontype];
            element[ontype] = makeHandler(element, handler, oldHandler, type);
        }
    };

    function makeHandler(element, newHandler, oldHandlers, type) {
        var handler = function (event) {
            event = event || fixEvent(window.event);
            if (!event) {
                return undefined;
            }
            event.target = event.srcElement;

            var ret = true;
            var oldResult, newResult;
            if (typeof oldHandlers === 'function') {
                oldResult = oldHandlers(event);
            }
            newResult = newHandler.call(element, event);
            if (type !== 'beforeunload') {
                if (false === oldResult || false === newResult) {
                    ret = false;
                }
                return ret;
            }
        };
        return handler;
    }
    registerEvent.apply(null, arguments);
};

_.getURLSearchParams = function (queryString) {
    queryString = queryString || '';
    var args = {};
    var query = queryString.substring(1);
    var pairs = query.split('&');
    for (var i = 0; i < pairs.length; i++) {
        var pos = pairs[i].indexOf('=');
        if (pos === -1) continue;
        var name = pairs[i].substring(0, pos);
        var value = pairs[i].substring(pos + 1);
        name = _.decodeURIComponent(name);
        value = _.decodeURIComponent(value);
        args[name] = value;
    }
    return args;
};
_.urlParse = function (url) {
    var URLParser = function (url) {
        this._fields = {
            Username: 4,
            Password: 5,
            Port: 7,
            Protocol: 2,
            Host: 6,
            Path: 8,
            URL: 0,
            QueryString: 9,
            Fragment: 10
        };
        this._values = {};
        this._regex = /^((\w+):\/\/)?((\w+):?(\w+)?@)?([^\/\?:]+):?(\d+)?(\/?[^\?#]+)?\??([^#]+)?#?(\w*)/;

        if (typeof url !== 'undefined') {
            this._parse(url);
        }
    };

    URLParser.prototype.setUrl = function (url) {
        this._parse(url);
    };

    URLParser.prototype._initValues = function () {
        for (var a in this._fields) {
            this._values[a] = '';
        }
    };

    URLParser.prototype.addQueryString = function (queryObj) {
        if (typeof queryObj !== 'object') {
            return false;
        }
        var query = this._values.QueryString || '';
        for (var i in queryObj) {
            if (new RegExp(i + '[^&]+').test(query)) {
                query = query.replace(new RegExp(i + '[^&]+'), i + '=' + queryObj[i]);
            } else {
                if (query.slice(-1) === '&') {
                    query = query + i + '=' + queryObj[i];
                } else {
                    if (query === '') {
                        query = i + '=' + queryObj[i];
                    } else {
                        query = query + '&' + i + '=' + queryObj[i];
                    }
                }
            }
        }
        this._values.QueryString = query;
    };

    URLParser.prototype.getUrl = function () {
        var url = '';
        url += this._values.Origin;
        url += this._values.Port ? ':' + this._values.Port : '';
        url += this._values.Path;
        url += this._values.QueryString ? '?' + this._values.QueryString : '';
        url += this._values.Fragment ? '#' + this._values.Fragment : '';
        return url;
    };

    URLParser.prototype._parse = function (url) {
        this._initValues();

        var b = this._regex.exec(url);
        if (!b) {
            Log.i('URLParser::_parse -> Invalid URL');
        }

        var urlTmp = url.split('#');
        var urlPart = urlTmp[0];
        var hashPart = urlTmp.slice(1).join('#');
        b = this._regex.exec(urlPart);
        for (var c in this._fields) {
            if (typeof b[this._fields[c]] !== 'undefined') {
                this._values[c] = b[this._fields[c]];
            }
        }
        this._values['Hostname'] = this._values['Host'].replace(/:\d+$/, '');
        this._values['Origin'] = this._values['Protocol'] + '://' + this._values['Hostname'];
        this._values['Fragment'] = hashPart;
    };

    return new URLParser(url);
};
_.trim = function (str) {
    return str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
};
_.URL = function (url) {
    var result = {};
    var isURLAPIWorking = function () {
        var url;
        try {
            url = new URL('http://modernizr.com/');
            return url.href === 'http://modernizr.com/';
        } catch (e) {
            return false;
        }
    };
    if (typeof window.URL === 'function' && isURLAPIWorking()) {
        result = new URL(url);
        if (!result.searchParams) {
            result.searchParams = (function () {
                var params = _.getURLSearchParams(result.search);
                return {
                    get: function (searchParam) {
                        return params[searchParam];
                    }
                };
            })();
        }
    } else {
        if (!_.check.isString(url)) {
            url = String(url);
        }
        url = _.trim(url);
        var _regex = /^https?:\/\/.+/;
        if (_regex.test(url) === false) {
            Log.w('Invalid URL');
            return;
        }
        var instance = _.urlParse(url);
        result.hash = instance._values.Fragment;
        result.host = instance._values.Host ? instance._values.Host + (instance._values.Port ? ':' + instance._values.Port : '') : '';
        result.href = instance._values.URL;
        result.password = instance._values.Password;
        result.pathname = instance._values.Path;
        result.port = instance._values.Port;
        result.search = instance._values.QueryString ? '?' + instance._values.QueryString : '';
        result.username = instance._values.Username;
        result.hostname = instance._values.Hostname;
        result.protocol = instance._values.Protocol ? instance._values.Protocol + ':' : '';
        result.origin = instance._values.Origin ? instance._values.Origin + (instance._values.Port ? ':' + instance._values.Port : '') : '';
        result.searchParams = (function () {
            var params = _.getURLSearchParams('?' + instance._values.QueryString);
            return {
                get: function (searchParam) {
                    return params[searchParam];
                }
            };
        })();
    }
    return result;
};
class Log {
    static i() {
        if (!this.showLog) {
            return false;
        }
        if (this.showLog === true || this.showLog === 'string') {
            arguments[0] = _.formatJsonString(arguments[0]);
        }
        if (typeof console === 'object' && console.log) {
            try {
                return console.log.apply(console, arguments);
            }
            catch (e) {
                console.log(arguments[0]);
            }
        }
    }

    static w() {
        if (!this.showLog) {
            return false;
        }

        if (this.showLog === true || this.showLog === 'string') {
            arguments[0] = _.formatJsonString(arguments[0]);
        }

        if (typeof console === 'object' && console.warn) {
            try {
                return console.warn.apply(console, arguments);
            }
            catch (e) {
                console.warn(arguments[0]);
            }
        }
    }
}

export { _, Log, slice };
