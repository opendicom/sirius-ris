import { NgModule, APP_INITIALIZER } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CalendarRoutingModule } from './calendar-routing.module';

import { AppInitializer } from '@app/app-initializer';
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
  ],
  providers: [
    // If you enter this module directly having an authentication file in the browser, it is necessary to 
    // initialize the app from the module (For example: entry from a marker of a specific component):
    AppInitializer,
    { provide: APP_INITIALIZER, useFactory: (appInitializer: AppInitializer) => appInitializer.initializeApp(), multi: true, deps: [AppInitializer] },
  ]
})
export class CalendarModule { }
