import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ListComponent } from '@modules/check-in-boards/components/list/list.component';
import { DetailsComponent } from '@modules/check-in-boards/components/details/details.component';

const routes: Routes = [
  {
    path: '',
    children: [
      { path: 'list', component: ListComponent },
      { path: 'details/:_id', component: DetailsComponent },
      { path: '**', redirectTo: 'list' },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CheckInBoardsRoutingModule { }
