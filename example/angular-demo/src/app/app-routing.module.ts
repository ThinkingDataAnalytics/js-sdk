import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PageBComponent } from './page-b/page-b.component';

const routes: Routes = [
  {
    path: 'pageb',
    component: PageBComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
