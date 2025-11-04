import { Component } from '@angular/core';
import ta from 'thinkingdata-browser';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'angular-demo';
  handleClick() {
    var config = {
      appId: "381f8bbad66c41a18923089321a1ba6f",
      serverUrl: "https://receiver-ta-preview.thinkingdata.cn",
      autoTrack: {
        pageShow: true, //开启页面展示事件，事件名ta_page_show
        pageHide: true, //开启页面隐藏事件，事件名ta_page_hide
      }
    };
    ta.init(config);
    ta.track("tttt",{name:'ddd'})
    ta.login("AAA")
    ta.userSet({user_a:'aaaaa'})
    ta.userAdd({});
    ta.userDelete()
    ta.trackUpdate({})
    ta.unsetSuperProperty("")
  }
}
