import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SuperuserGuard } from '@guards/superuser.guard';
import { ListComponent } from '@modules/organizations/components/list/list.component';
import { FormComponent } from '@modules/organizations/components/form/form.component';

const routes: Routes = [
  {
    path: '',
    canActivate: [SuperuserGuard],
    canActivateChild: [SuperuserGuard],
    children: [
      { path: 'list', component: ListComponent, canActivate: [SuperuserGuard] },
      { path: 'list/:_id', component: ListComponent, canActivate: [SuperuserGuard] },
      { path: 'form/:action/:_id', component: FormComponent, canActivate: [SuperuserGuard] },
      { path: '**', redirectTo: 'list' },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrganizationsRoutingModule { }
