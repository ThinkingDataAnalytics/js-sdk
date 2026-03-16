export default function addSinglePageEvent(callback) {
    // 1. 初始化：记录当前页面 URL（作为「上一页 URL」的初始值）
    var current_url = location.href;
  
    // 2. 保存原生的 pushState/replaceState 方法（后续要劫持，需保留原方法）
    var historyPushState = window.history.pushState;
    var historyReplaceState = window.history.replaceState;
  
    // 3. 劫持 history.pushState 方法（核心：监听主动调用 pushState 的路由切换）
    if (isFunction(window.history.pushState)) {
      window.history.pushState = function() {
        // 先执行原生 pushState，保证路由正常切换
        historyPushState.apply(window.history, arguments);
        console.log('historyPushState', current_url,new Date().getTime());
        // 执行回调：把「切换前的 URL」传给回调（即上一页 URL）
        callback(current_url);
        // 更新 current_url 为新的 URL，供下一次切换使用
        current_url = location.href;
        console.log('historyPushState1', current_url,new Date().getTime());
      };
    }
  
    // 4. 劫持 history.replaceState 方法（逻辑和 pushState 一致）
    if (isFunction(window.history.replaceState)) {
      window.history.replaceState = function() {
        historyReplaceState.apply(window.history, arguments);
        console.log('historyReplaceState', current_url,new Date().getTime());
        callback(current_url);
        current_url = location.href;
        console.log('historyReplaceState1', current_url,new Date().getTime());
      };
    }
  
    // 5. 兼容处理：根据浏览器环境选择监听的原生事件
    var singlePageEvent;
    if (window.document.documentMode) {
      // IE 浏览器：监听 hashchange 事件（哈希路由变化）
      singlePageEvent = 'hashchange';
    } else {
      // 现代浏览器：有 pushState 则监听 popstate（前进/后退），否则监听 hashchange
      singlePageEvent = historyPushState ? 'popstate' : 'hashchange';
    }
  
    // 6. 监听原生事件（处理浏览器前进/后退、hash 变化的场景）
    addEvent(window, singlePageEvent, function() {
      console.log('addEvent', current_url);
      callback(current_url); // 传递上一页 URL
      current_url = location.href; // 更新当前 URL
    });
  }
  
  function isFunction(func) {
    return typeof func === 'function';
  }
  
  function addEvent(element, eventName, handler) {
    if (element.addEventListener) {
      element.addEventListener(eventName, handler, false);
    } else {
      element.attachEvent('on' + eventName, handler);
    }
  }