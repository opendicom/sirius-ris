import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ListComponent } from '@modules/performing/components/list/list.component';
import { FormComponent } from '@modules/performing/components/form/form.component';
import { MedicalLockerComponent } from '@modules/performing/components/medical-locker/medical-locker.component';

const routes: Routes = [
  {
    path: '',
    children: [
      { path: 'list', component: ListComponent },

      // In Performing, _id can have two entries:
      // Default case (most common): _id with the performing identifier.
      // Medical Locker case: String with separators, format data: |fk_reporting_id|flow_state|urgency|
      { path: 'list/:_id', component: ListComponent },

      { path: 'form/:action/:_id', component: FormComponent },
      { path: 'form/:action/:_id/:origin', component: FormComponent },
      { path: 'form/:action/:_id/:origin/:tabIndex', component: FormComponent },
      { path: 'locker', component: MedicalLockerComponent },
      { path: '**', redirectTo: 'list' },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PerformingRoutingModule { }
