import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ListComponent } from '@modules/check-in//components/list/list.component';

const routes: Routes = [
  {
    path: '',
    children: [
      { path: 'list', component: ListComponent },
      { path: '**', redirectTo: 'list' },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CheckInRoutingModule { }
