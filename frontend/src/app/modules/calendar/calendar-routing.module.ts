import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SlotsAppointmentsComponent } from '@modules/calendar/components/slots-appointments/slots-appointments.component';

const routes: Routes = [
  {
    path: '',
    children: [
      { path: 'slots_appointments', component: SlotsAppointmentsComponent },
      { path: '**', redirectTo: 'slots_appointments' },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CalendarRoutingModule { }
