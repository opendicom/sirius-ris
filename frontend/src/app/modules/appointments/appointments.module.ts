import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AppointmentsRoutingModule } from '@modules/appointments/appointments-routing.module';

import { SharedModule } from '@shared/shared.module';
import { SharedMaterialModule } from '@shared/shared-material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ListComponent } from '@modules/appointments/components/list/list.component';
import { FormComponent } from '@modules/appointments/components/form/form.component';
import { CheckPersonComponent } from '@modules/appointments/components/check-person/check-person.component';
import { SelectProcedureComponent } from '@modules/appointments/components/select-procedure/select-procedure.component';
import { SelectSlotComponent } from '@modules/appointments/components/select-slot/select-slot.component';

//---------------------------------------------------------------------------------------------------------------------------//
// FullCalendar:
//---------------------------------------------------------------------------------------------------------------------------//
import { FullCalendarModule } from '@fullcalendar/angular';                   // FullCalendar Module
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';         // Time Grid Plugin

//Register FullCalendar plugins:
FullCalendarModule.registerPlugins([
  resourceTimeGridPlugin,
]);
//---------------------------------------------------------------------------------------------------------------------------//


@NgModule({
  declarations: [
    ListComponent,
    FormComponent,
    CheckPersonComponent,
    SelectProcedureComponent,
    SelectSlotComponent
  ],
  imports: [
    CommonModule,
    AppointmentsRoutingModule,
    SharedModule,
    SharedMaterialModule,
    FormsModule,
    ReactiveFormsModule,

    //FullCalendar:
    FullCalendarModule
  ]
})
export class AppointmentsModule { }
