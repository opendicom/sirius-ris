import { NgModule, APP_INITIALIZER } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StatsRoutingModule } from '@modules/stats/stats-routing.module';

import { AppInitializer } from '@app/app-initializer';
import { SharedModule } from '@shared/shared.module';
import { SharedMaterialModule } from '@shared/shared-material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MainComponent } from '@modules/stats/components/main/main.component';
import { StatsAppointmentRequestsComponent } from '@modules/stats/components/stats-appointment-requests/stats-appointment-requests.component';
import { StatsAppointmentsComponent } from '@modules/stats/components/stats-appointments/stats-appointments.component';
import { StatsPerformingComponent } from '@modules/stats/components/stats-performing/stats-performing.component';
import { StatsReportsComponent } from '@modules/stats/components/stats-reports/stats-reports.component';

// NgxCharts:
import { NgxChartsModule }from '@swimlane/ngx-charts';                            

@NgModule({
  declarations: [
    MainComponent,
    StatsAppointmentRequestsComponent,
    StatsAppointmentsComponent,
    StatsPerformingComponent,
    StatsReportsComponent
  ],
  imports: [
    CommonModule,
    StatsRoutingModule,
    SharedModule,
    SharedMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    NgxChartsModule
  ],
  providers: [
    // If you enter this module directly having an authentication file in the browser, it is necessary to 
    // initialize the app from the module (For example: entry from a marker of a specific component):
    AppInitializer,
    { provide: APP_INITIALIZER, useFactory: (appInitializer: AppInitializer) => appInitializer.initializeApp(), multi: true, deps: [AppInitializer] },
  ]
})
export class StatsModule { }
