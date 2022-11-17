import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CalendarRoutingModule } from './calendar-routing.module';

import { SharedModule } from '@shared/shared.module';
import { SharedMaterialModule } from '@shared/shared-material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { SlotsAppointmentsComponent } from '@modules/calendar/components/slots-appointments/slots-appointments.component';

//---------------------------------------------------------------------------------------------------------------------------//
// FullCalendar:
//---------------------------------------------------------------------------------------------------------------------------//
//Import modules and plugins:
import { FullCalendarModule } from '@fullcalendar/angular';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import interactionPlugin from '@fullcalendar/interaction';

//Register FullCalendar plugins:
FullCalendarModule.registerPlugins([
  resourceTimeGridPlugin,
  interactionPlugin
]);
//---------------------------------------------------------------------------------------------------------------------------//

@NgModule({
  declarations: [
    SlotsAppointmentsComponent
  ],
  imports: [
    CommonModule,
    CalendarRoutingModule,
    SharedModule,
    SharedMaterialModule,
    FormsModule,
    ReactiveFormsModule,

    //FullCalendar:
    FullCalendarModule,
  ]
})
export class CalendarModule { }
