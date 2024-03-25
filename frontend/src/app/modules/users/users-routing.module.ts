import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ListComponent } from '@modules/users/components/list/list.component';
import { FormComponent } from '@modules/users/components/form/form.component';
import { FormMachineComponent } from '@modules/users/components/form-machine/form-machine.component';

const routes: Routes = [
  {
    path: '',
    children: [
      { path: 'list', component: ListComponent },
      { path: 'list/:_id', component: ListComponent },
      { path: 'form/:action/:_id', component: FormComponent },
      { path: 'form/:action/:_id/:destiny', component: FormComponent },
      { path: 'form_machine/:action/:_id', component: FormMachineComponent },
      { path: '**', redirectTo: 'list' },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UsersRoutingModule { }
