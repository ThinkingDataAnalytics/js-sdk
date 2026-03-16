<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <button @click="handleClick">SDK初始化</button>
    <button @click="handleTrack">发送事件</button>
    <button @click="handlePer">最佳实践</button>
    <button @click="handleJump">跳转到PageB</button>
  </div>
</template>

<script>
import ta from 'thinkingdata-browser';
// import addSinglePageEvent from './Test';
export default {
  name: 'HelloWorld',
  props: {
    msg: String
  },
  methods: {
    // 定义点击事件处理函数
    handleClick() {
      var config = {
        appId: "381f8bbad66c41a18923089321a1ba6f",
        serverUrl: "https://receiver-ta-preview.thinkingdata.cn",
        autoTrack: {
          pageShow: true, //开启页面展示事件，事件名ta_page_show
          pageHide: true, //开启页面隐藏事件，事件名ta_page_hide
          pageView: true, //开启页面视图事件，事件名ta_pageview
        },
        properties: { // 自动采集自定义属性
          staticKey: 'staticValue'
        },
        callback: (eventType) => { // 自动采集回调
          if (eventType === 'pageShow') {
            return { appShowKey: 'appShowValue' };
          } else if (eventType === 'pageHide') {
            return { appHideKey: 'appHideValue' };
          } else if (eventType === 'pageView') {
            return { appViewKey: 'appViewValue' };
          }
          else {
            return {};
          }
        },
      };
      ta.init(config);
      // ta.trackLink({
      //   tag: ["a", "button"], //HTML标签
      //   class: ["class1", "class2"], //自定义的Class名称
      //   id: ["id1", "id2"] //自定义的ID名称
      // }, "click", {
      //   production: "产品名",
      //   // name: "元素标识名"
      // });
    },
    handleTrack() {
      ta.track(
        "product_buy", //事件名称
        //事件属性
        { product_name: "商品名" });
      // addSinglePageEvent((url) => {
      //   console.log('全局监听路由切换：', url);
      // });
    },
    handlePer() {
      ta.login("TA");
      //设置公共事件属性
      var superProperties = {};
      superProperties["channel"] = "ta";//字符串
      superProperties["age"] = 1;//数字
      superProperties["isSuccess"] = true;//布尔
      superProperties["birthday"] = new Date();//时间
      superProperties["object"] = { key: "value" };//对象
      superProperties["object_arr"] = [{ key: "value" }];//对象组
      superProperties["arr"] = ["value"];//数组
      ta.setSuperProperties(superProperties);//设置公共事件属性

      //发送事件
      ta.track("product_buy", //事件名称
        //事件属性
        { product_name: "商品名" });

      //设置用户属性
      ta.userSet({ username: "TA" });
    },
    handleJump() {
    // 实现页面跳转到 PageB
      this.$router.push({ name: "PageB" });
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}
</style>
