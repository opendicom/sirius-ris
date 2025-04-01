import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedRoutingModule } from '@shared/shared-routing.module';

// Angular Material Modules and Components:
import { SharedMaterialModule } from '@shared/shared-material.module';

// Shared components:
import { HeaderComponent } from '@shared/components/main-structure/header/header.component';
import { SidenavComponent } from '@shared/components/main-structure/sidenav/sidenav.component';
import { ActionComponent } from '@shared/components/main-structure/action/action.component';
import { FooterComponent } from '@shared/components/main-structure/footer/footer.component';
import { StartPageComponent } from '@shared/components/start-page/start-page.component';
import { SettingsComponent } from '@shared/components/settings/settings.component';
import { NotFoundComponent } from '@shared/components/not-found/not-found.component';

//DICOM Viewer component (For patients):
import { DcmViewerComponent } from '@shared/components/dcm-viewer/dcm-viewer.component';

//Default patients init:
import { PatientsComponent } from '@shared/components/patients/patients.component';

//Dialogs components:
import { DeleteItemsComponent } from '@shared/components/dialogs/delete-items/delete-items.component';
import { FoundPersonComponent } from '@shared/components/dialogs/found-person/found-person.component';
import { SlotSelectComponent } from '@shared/components/dialogs/slot-select/slot-select.component';
import { OverlapEventsComponent } from '@shared/components/dialogs/overlap-events/overlap-events.component';
import { TentativeExistComponent } from '@shared/components/dialogs/tentative-exist/tentative-exist.component';
import { EventDetailsComponent } from '@shared/components/dialogs/event-details/event-details.component';
import { DeleteAppointmentDraftComponent } from '@shared/components/dialogs/delete-appointment-draft/delete-appointment-draft.component';
import { MwlResendComponent } from '@shared/components/dialogs/mwl-resend/mwl-resend.component';
import { ReportReviewComponent } from '@shared/components/dialogs/report-review/report-review.component';
import { PasswordRequestComponent } from '@shared/components/dialogs/password-request/password-request.component';
import { PerformingDownloadsComponent } from '@shared/components/dialogs/performing-downloads/performing-downloads.component';
import { MailDeliveryComponent } from '@shared/components/dialogs/mail-delivery/mail-delivery.component';
import { DicomAccessComponent } from '@shared/components/dialogs/dicom-access/dicom-access.component';
import { AppointmentRequestDetailsComponent } from '@shared/components/dialogs/appointment-request-details/appointment-request-details.component';
import { SearchInfoComponent } from '@shared/components/dialogs/search-info/search-info.component';
import { PatientDetailsComponent } from '@shared/components/dialogs/patient-details/patient-details.component';

// Shared pipes:
import { HighlighterPipe } from '@shared/pipes/highlighter.pipe';
import { AccnoDatePipe } from '@shared/pipes/accno_date.pipe';
import { SafeURLPipe } from '@shared/pipes/safe_url.pipe';

// Required for bidirectional binding (ngModule):
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Import all Input Control directives:
import * as IC from '@shared/directives/input-control.directive';

@NgModule({
  declarations: [
    // Shared components:
    HeaderComponent,
    SidenavComponent,
    ActionComponent,
    FooterComponent,
    StartPageComponent,
    SettingsComponent,
    NotFoundComponent,

    //DICOM Viewer component (For patients):
    DcmViewerComponent,

    //Default patients init:
    PatientsComponent,

    // Dialogs components:
    DeleteItemsComponent,
    FoundPersonComponent,
    SlotSelectComponent,
    OverlapEventsComponent,
    TentativeExistComponent,
    EventDetailsComponent,
    DeleteAppointmentDraftComponent,
    MwlResendComponent,
    ReportReviewComponent,
    PasswordRequestComponent,
    PerformingDownloadsComponent,
    MailDeliveryComponent,
    DicomAccessComponent,
    AppointmentRequestDetailsComponent,
    SearchInfoComponent,
    PatientDetailsComponent,

    // Shared pipes:
    HighlighterPipe,
    AccnoDatePipe,
    SafeURLPipe,

    //Input Control:
    IC.numbersDirective,
    IC.numbersWSDirective,
    IC.numbersWDDirective,
    IC.lettersDirective,
    IC.lettersWSDirective,
    IC.specialCharsDirective,
    IC.specialCharsWSDirective
  ],
  imports: [
    CommonModule,
    SharedRoutingModule,
    SharedMaterialModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    // Shared components:
    HeaderComponent,
    SidenavComponent,
    ActionComponent,
    FooterComponent,
    StartPageComponent,
    SettingsComponent,
    NotFoundComponent,
    SharedMaterialModule,

    //DICOM Viewer component (For patients):
    DcmViewerComponent,

    //Default patients init:
    PatientsComponent,

    // Dialogs components:
    DeleteItemsComponent,
    FoundPersonComponent,
    SlotSelectComponent,
    OverlapEventsComponent,
    TentativeExistComponent,
    EventDetailsComponent,
    DeleteAppointmentDraftComponent,
    MwlResendComponent,
    ReportReviewComponent,
    PasswordRequestComponent,
    PerformingDownloadsComponent,
    MailDeliveryComponent,
    DicomAccessComponent,
    AppointmentRequestDetailsComponent,
    SearchInfoComponent,
    PatientDetailsComponent,

    // Shared pipes:
    HighlighterPipe,
    AccnoDatePipe,
    SafeURLPipe,

    //Input Control:
    IC.numbersDirective,
    IC.numbersWSDirective,
    IC.numbersWDDirective,
    IC.lettersDirective,
    IC.lettersWSDirective,
    IC.specialCharsDirective,
    IC.specialCharsWSDirective
  ]
})
export class SharedModule { }
