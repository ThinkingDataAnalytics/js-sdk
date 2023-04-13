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
                Log.w('The format of Data-', k, v, ' does not meet the requirements and may not be stored correctly. The attribute value only supports String, Number, Date, Boolean, Array，Object');
            }
        });
        return prop;
    }

    static _checkPropertiesKey(obj) {
        var flag = true;
        _.each(obj, (content, key) => {
            if (!KEY_NAME_MATCH_REGEX.test(key)) {
                Log.w('invalid key: ' + key);
                flag = false;
            }
        });
        return flag;
    }
    static event(s) {
        if (!_.check.isString(s) || !KEY_NAME_MATCH_REGEX.test(s)) {
            Log.w('Please check the parameter format, eventName must be an English letter or a string starting with \'_\', containing letters and numbers with no more than 50 characters: ' + s);
            return false;
        } else {
            return true;
        }
    }

    static propertyName(s) {
        if (!_.check.isString(s) || !KEY_NAME_MATCH_REGEX.test(s)) {
            Log.w('Please check the parameter format, propertyName must be an English letter or a string starting with \'_\', containing letters and numbers with no more than 50 characters: ' + s);
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
                    Log.w('Please check the parameter format, the key of properties can only start with a letter, contain numbers, letters and underscores _, and the maximum length is 50 characters');
                    return false;
                }
            } else {
                return false;
            }
        } else {
            return true;
        }
    }
    static propertiesMust(p) {
        this.stripProperties(p);
        if (p === undefined || !_.check.isObject(p) || _.check.isEmptyObject(p)) {
            Log.w('properties must be objects and have values');
            return false;
        } else {
            if (this._checkPropertiesKey(p)) {
                return true;
            } else {
                Log.w('Please check the parameter format, the key of properties can only start with a letter, contain numbers, letters and underscores _, and the maximum length is 50 characters');
                return false;
            }
        }
    }
    static userId(id) {
        if (_.check.isString(id) && /^.{1,63}$/.test(id)) {
            return true;
        } else {
            Log.w('User id must be a string that cannot be empty and is less than 64 bits');
            return false;
        }
    }
}
