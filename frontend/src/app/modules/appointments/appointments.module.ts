import { NgModule, APP_INITIALIZER } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AppointmentsRoutingModule } from '@modules/appointments/appointments-routing.module';

import { AppInitializer } from '@app/app-initializer';
import { SharedModule } from '@shared/shared.module';
import { SharedMaterialModule } from '@shared/shared-material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ListComponent } from '@modules/appointments/components/list/list.component';
import { SetPatientComponent } from '@modules/appointments/components/set-patient/set-patient.component';
import { SelectProcedureComponent } from '@modules/appointments/components/select-procedure/select-procedure.component';
import { SelectSlotComponent } from '@modules/appointments/components/select-slot/select-slot.component';
import { FormInsertComponent } from '@modules/appointments/components/form-insert/form-insert.component';
import { FormUpdateComponent } from '@modules/appointments/components/form-update/form-update.component';
import { TabDetailsComponent } from '@modules/appointments/components/form-update/tab-details/tab-details.component';
import { TabSlotComponent } from '@modules/appointments/components/form-update/tab-slot/tab-slot.component';
import { ListDraftsComponent } from '@modules/appointments/components/list-drafts/list-drafts.component';
import { ListRequestsComponent } from '@modules/appointments/components/list-requests/list-requests.component';
import { FormRequestComponent } from '@modules/appointments/components/form-request/form-request.component';

// Import CKEditor Module:
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';

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
    ListComponent,
    SetPatientComponent,
    SelectProcedureComponent,
    SelectSlotComponent,
    FormInsertComponent,
    FormUpdateComponent,
    TabDetailsComponent,
    TabSlotComponent,
    ListDraftsComponent,
    ListRequestsComponent,
    FormRequestComponent
  ],
  imports: [
    CommonModule,
    AppointmentsRoutingModule,
    SharedModule,
    SharedMaterialModule,
    FormsModule,
    ReactiveFormsModule,

    //FullCalendar:
    FullCalendarModule,

    //CKEditor:
    CKEditorModule
  ],
  providers: [
    // If you enter this module directly having an authentication file in the browser, it is necessary to 
    // initialize the app from the module (For example: entry from a marker of a specific component):
    AppInitializer,
    { provide: APP_INITIALIZER, useFactory: (appInitializer: AppInitializer) => appInitializer.initializeApp(), multi: true, deps: [AppInitializer] },
  ]
})
export class AppointmentsModule { }
