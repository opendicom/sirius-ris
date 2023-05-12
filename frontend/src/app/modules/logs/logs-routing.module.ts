import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ListByUserComponent } from '@modules/logs/components/list-by-user/list-by-user.component';
import { ListByElementComponent } from '@modules/logs/components/list-by-element/list-by-element.component';

const routes: Routes = [
  {
    path: '',
    children: [
      { path: 'user', component: ListByUserComponent },
      { path: 'user/:_id', component: ListByUserComponent },
      { path: 'element/:element_type/:element_id', component: ListByElementComponent },
      { path: 'element/:element_type/:element_id/:_id', component: ListByElementComponent },
      { path: '**', redirectTo: 'user' },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LogsRoutingModule { }
