import {
    _,
    Log
} from './utils.js';

/** @const */
var KEY_NAME_MATCH_REGEX = /^[a-zA-Z][a-zA-Z0-9_]{0,49}$/;

export class PropertyChecker {
    static stripProperties(prop) {
        if (!_.check.isObject(prop)) {
            return prop;
        }
        _.each(prop, function (v, k) {
            if (!(_.check.isString(v) || _.check.isNumber(v) || _.check.isDate(v) || _.check.isBoolean(v) || _.check.isArray(v)||_.check.isObject(v))) {
                Log.w('您的数据-', k, v, '-格式不满足要求，可能无法正确入库. 属性值只支持 String, Number, Date, Boolean, Array，Object');
            }
        });
        return prop;
    }

    static _checkPropertiesKey(obj) {
        var flag = true;
        _.each(obj, (content, key) => {
            if (!KEY_NAME_MATCH_REGEX.test(key)) {
                Log.w('不合法的 KEY 值: ' + key);
                flag = false;
            }
        });
        return flag;
    }
    static event(s) {
        if (!_.check.isString(s) || !KEY_NAME_MATCH_REGEX.test(s)) {
            Log.w('请检查参数格式, eventName 必须是英文字母或者 \'_\' 开头, 包含字母和数字的不超过50个字符的字符串: ' + s);
            return false;
        } else {
            return true;
        }
    }

    static propertyName(s) {
        if (!_.check.isString(s) || !KEY_NAME_MATCH_REGEX.test(s)) {
            Log.w('请检查参数格式, propertyName 必须是英文字母或者 \'_\' 开头, 包含字母和数字的不超过50个字符的字符串: ' + s);
            return false;
        } else {
            return true;
        }
    }
    static properties(p) {
        this.stripProperties(p);
        if (p) {
            if (_.check.isObject(p)) {
                if (this._checkPropertiesKey(p)) {
                    return true;
                } else {
                    Log.w('请检查参数格式, properties 的 key 只能以字母开头，包含数字、字母和下划线 _，长度最大为50个字符');
                    return false;
                }
            } else {
                Log.w('properties 可以没有，但有的话必须是对象');
                return false;
            }
        } else {
            return true;
        }
    }
    static propertiesMust(p) {
        this.stripProperties(p);
        if (p === undefined || !_.check.isObject(p) || _.check.isEmptyObject(p)) {
            Log.w('properties必须是对象且有值');
            return false;
        } else {
            if (this._checkPropertiesKey(p)) {
                return true;
            } else {
                Log.w('请检查参数格式, properties 的 key 只能以字母开头，包含数字、字母和下划线 _，长度最大为50个字符');
                return false;
            }
        }
    }
    static userId(id) {
        if (_.check.isString(id) && /^.{1,63}$/.test(id)) {
            return true;
        } else {
            Log.w('用户 id 必须是不能为空，且小于 64 位的字符串');
            return false;
        }
    }
}
