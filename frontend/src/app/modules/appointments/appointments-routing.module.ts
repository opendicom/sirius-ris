import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ListComponent } from '@modules/appointments/components/list/list.component';
import { SetPatientComponent } from '@modules/appointments/components/set-patient/set-patient.component';
import { SelectProcedureComponent } from '@modules/appointments/components/select-procedure/select-procedure.component';
import { SelectSlotComponent } from '@modules/appointments/components/select-slot/select-slot.component';
import { FormInsertComponent } from '@modules/appointments/components/form-insert/form-insert.component';
import { FormUpdateComponent } from '@modules/appointments/components/form-update/form-update.component';
import { ListDraftsComponent } from '@modules/appointments/components/list-drafts/list-drafts.component';
import { ListRequestsComponent } from '@modules/appointments/components/list-requests/list-requests.component';
import { FormRequestComponent } from '@modules/appointments/components/form-request/form-request.component';

const routes: Routes = [
  {
    path: '',
    children: [
      { path: 'list', component: ListComponent },
      { path: 'list/:_id', component: ListComponent },

      //Appointments drafts list:
      { path: 'list_drafts', component: ListDraftsComponent },
      { path: 'list_drafts/:_id', component: ListDraftsComponent },

      //Appointment requests list:
      { path: 'list_requests', component: ListRequestsComponent },
      { path: 'list_requests/:_id', component: ListRequestsComponent },

      //Appointments form secuence:
      { path: 'set_patient', component: SetPatientComponent },
      { path: 'set_patient/:appointment_request', component: SetPatientComponent },
      { path: 'select_procedure', component: SelectProcedureComponent },
      { path: 'select_procedure/:appointment_request', component: SelectProcedureComponent },
      { path: 'select_slot', component: SelectSlotComponent },
      { path: 'select_slot/:appointment_request', component: SelectSlotComponent },
      { path: 'form/insert', component: FormInsertComponent },
      { path: 'form/insert/:appointment_request', component: FormInsertComponent },
      { path: 'form/update/:_id', component: FormUpdateComponent },

      //Appointment requests form:
      { path: 'form/request/:_id', component: FormRequestComponent },

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
