declare namespace thinkingdata {
    function init(param: object): void;
    function trackLink(dom: object, eventName: string, eventProperties: object): void;
    function track(eventName: string, eventProperties?: object, eventTime?: Date, callback?: Function): void;
    function initInstance(name: string, param: object): void;
    function login(accountId: string): void;
    function setPageProperty(obj: object): void;
    function getPageProperty(): object;
    function getPresetProperties(): PresetProperties;
    function logout(isChangeId?: boolean): void;
    function userSet(userProperties: object, callback?:Function): void;
    function userSetOnce(userProperties: object, callback?: Function): void;
    function userUnset(property: string, callback?: any): void;
    function userAdd(userProperties: object, callback?: Function): void;
    function userAppend(userProperties: object, callback?: Function): void;
    function userUniqAppend(userProperties: object, callback?: Function): void;
    function flush(): void;
    function userDel(callback?: Function): void;
    function userDelete(callback?: Function): void;
    function trackUpdate(taEvent: object): void;
    function trackOverwrite(taEvent: object): void;
    function trackFirstEvent(taEvent: object): void;
    function trackFirst(taEvent:object): void;
    function identify(id: string): void;
    function setDistinctId(id: string): void;
    function getDistinctId(): string;
    function getDeviceId(): string;
    function setSuperProperties(superProperties: object): void;
    function getSuperProperties(): object;
    function clearSuperProperties(): void;
    function unsetSuperProperty(propertyName: string): void;
    function setDynamicSuperProperties(dynamicProperties: object): void;
    function timeEvent(eventName: string): void;
    function quick(type: string, properties?: object): void;
    function enableTracking(enabled: boolean): void;
    function optOutTracking(): void;
    function optInTracking(): void;
    function setTrackStatus(config: object): void;
}
declare class PresetProperties {
    toEventPresetProperties(): any;
}
export default thinkingdata;