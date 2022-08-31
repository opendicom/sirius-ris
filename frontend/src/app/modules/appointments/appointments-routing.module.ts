import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ListComponent } from '@modules/appointments/components/list/list.component';
import { FormComponent } from '@modules/appointments/components/form/form.component';
import { CheckPersonComponent } from '@modules/appointments/components/check-person/check-person.component';
import { SelectProcedureComponent } from '@modules/appointments/components/select-procedure/select-procedure.component';
import { SelectSlotComponent } from '@modules/appointments/components/select-slot/select-slot.component';

const routes: Routes = [
  {
    path: '',
    children: [
      { path: 'list', component: ListComponent },
      { path: 'list/:_id', component: ListComponent },

      //Appointments form secuence:
      { path: 'check_person', component: CheckPersonComponent },
      { path: 'select_procedure', component: SelectProcedureComponent },
      { path: 'select_slot', component: SelectSlotComponent },
      { path: 'form/:action/:_id', component: FormComponent },

      //Default path:
      { path: '**', redirectTo: 'list' },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AppointmentsRoutingModule { }
