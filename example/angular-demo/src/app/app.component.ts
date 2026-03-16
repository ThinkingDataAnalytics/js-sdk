import { Component } from '@angular/core';
import { Router } from '@angular/router';
import ta from 'thinkingdata-browser';
import addSinglePageEvent from './Test';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'angular-demo';
  
  constructor(private router: Router) {}

  handleClick() {
    var config = {
      appId: "381f8bbad66c41a18923089321a1ba6f",
      serverUrl: "https://receiver-ta-preview.thinkingdata.cn",
      autoTrack: {
        pageShow: true, //开启页面展示事件，事件名ta_page_show
        pageHide: true, //开启页面隐藏事件，事件名ta_page_hide
        pageView: true, //开启页面视图事件，事件名ta_pageview
      }
    };
    ta.init(config);
    ta.login("AAA")
  }
  handleAddSinglePageEvent() {
    addSinglePageEvent((url: string) => {
      console.log('全局监听路由切换：', url);
    });
  }
  handleJump() {
    this.router.navigate(['/pageb']);
  }
  handleTrackLink() {
    // ta.trackLink({
    //   tag: ["a", "button"],
    //   class: ["class1", "class2"],
    //   id: ["id1", "id2"]
    // }, "click", {
    //   name: "按钮点击"
    // });
    ta.quick('autoTrack', {
      name: 'test_name',
      time: new Date(),
      pro: [1, 2, 3, 4],
    });
  }
}
