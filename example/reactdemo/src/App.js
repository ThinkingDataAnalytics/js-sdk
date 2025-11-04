import logo from './logo.svg';
import './App.css';
import ta from 'thinkingdata-browser'
function App() {

  const handleInit = () => {
    var config = {
      appId: "381f8bbad66c41a18923089321a1ba6f",
      serverUrl: "https://receiver-ta-preview.thinkingdata.cn",
      autoTrack: {
        pageShow: true, //开启页面展示事件，事件名ta_page_show
        pageHide: true, //开启页面隐藏事件，事件名ta_page_hide
      }
    };
    ta.init(config);
  };

  const handleTrack = () => {
    ta.track(
      "product_buy", //事件名称
      //事件属性
      { product_name: "商品名" });
  };

  const handlePer = () => {
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
  }

  return (
    <div className="App">
      <button onClick={handleInit}>SDK初始化</button>
      <button onClick={handleTrack}>上报事件</button>
      <button onClick={handlePer}>最佳实践</button>
    </div>
  );
}

export default App;
