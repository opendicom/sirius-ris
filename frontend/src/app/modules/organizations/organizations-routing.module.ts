import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ListComponent } from '@modules/organizations/components/list/list.component';
import { FormComponent } from '@modules/organizations/components/form/form.component';

const routes: Routes = [
  {
    path: '',
    children: [
      { path: 'list', component: ListComponent },
      { path: 'form/:action/:id', component: FormComponent },
      { path: '**', redirectTo: 'list' },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrganizationsRoutingModule { }
