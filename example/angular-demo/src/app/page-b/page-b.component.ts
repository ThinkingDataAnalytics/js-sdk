import { Component } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-page-b',
  templateUrl: './page-b.component.html',
  styleUrls: ['./page-b.component.css']
})
export class PageBComponent {
  constructor(private location: Location) {}

  handleBack() {
    this.location.back();
  }
}
