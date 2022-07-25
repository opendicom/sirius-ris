import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ListComponent } from '@modules/users/components/list/list.component';
import { FormComponent } from '@modules/users/components/form/form.component';
import { FormMachineComponent } from '@modules/users/components/form-machine/form-machine.component';
import { CheckPersonComponent } from '@modules/users/components/check-person/check-person.component';

const routes: Routes = [
  {
    path: '',
    children: [
      { path: 'list', component: ListComponent },
      { path: 'list/:_id', component: ListComponent },
      { path: 'form/:action/:_id', component: FormComponent },
      { path: 'form-machine/:action/:_id', component: FormMachineComponent },
      { path: 'check', component: CheckPersonComponent },
      { path: '**', redirectTo: 'list' },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UsersRoutingModule { }
