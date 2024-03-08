import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from '@app/app-routing.module';
import { AppComponent } from '@app/app.component';

//---------------------------------------------------------------------------------------------------------------------------//
// Import AppInitializer:
// It runs before the application is fully loaded, making it a convenient place to load configuration.
//---------------------------------------------------------------------------------------------------------------------------//
import { AppInitializer } from '@app/app-initializer';
//---------------------------------------------------------------------------------------------------------------------------//

//---------------------------------------------------------------------------------------------------------------------------//
// Import LOCALE_ID to set locale code & language:
//---------------------------------------------------------------------------------------------------------------------------//
import { LOCALE_ID } from '@angular/core';
import es from '@angular/common/locales/es';
import { registerLocaleData } from '@angular/common';
registerLocaleData(es);
//---------------------------------------------------------------------------------------------------------------------------//

//---------------------------------------------------------------------------------------------------------------------------//
// Aditional imports:
//---------------------------------------------------------------------------------------------------------------------------//
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
//---------------------------------------------------------------------------------------------------------------------------//


//---------------------------------------------------------------------------------------------------------------------------//
// Shared Module:
//---------------------------------------------------------------------------------------------------------------------------//
import { SharedModule } from '@shared/shared.module';
import { HttpInterceptorService } from '@shared/services/http-interceptor.service';
//---------------------------------------------------------------------------------------------------------------------------//


//---------------------------------------------------------------------------------------------------------------------------//
// Auth:
//---------------------------------------------------------------------------------------------------------------------------//
import { AuthModule } from '@auth/auth.module';
//---------------------------------------------------------------------------------------------------------------------------//


//---------------------------------------------------------------------------------------------------------------------------//
// Modules:
//---------------------------------------------------------------------------------------------------------------------------//
import { ModalitiesModule } from '@modules/modalities/modalities.module';
import { OrganizationsModule } from '@modules/organizations/organizations.module';
import { BranchesModule } from '@modules/branches/branches.module';
import { ServicesModule } from '@modules/services/services.module';
import { EquipmentsModule } from '@modules/equipments/equipments.module';
import { UsersModule } from '@modules/users/users.module';
import { SlotsModule } from '@modules/slots/slots.module';
import { ProceduresModule } from '@modules/procedures/procedures.module';
import { ProcedureCategoriesModule } from '@modules/procedure-categories/procedure-categories.module';
import { FilesModule } from '@modules/files/files.module';
import { LogsModule } from '@modules/logs/logs.module';
import { AppointmentsModule } from '@modules/appointments/appointments.module';
import { CheckInModule } from '@modules/check-in/check-in.module';
import { CalendarModule } from '@modules/calendar/calendar.module';
import { PathologiesModule } from '@modules/pathologies/pathologies.module';
import { PerformingModule } from '@modules/performing/performing.module';
import { ReportsModule } from '@modules/reports/reports.module';
import { AdvancedSearchModule } from '@modules/advanced-search/advanced-search.module';
import { StatsModule } from '@modules/stats/stats.module';
//---------------------------------------------------------------------------------------------------------------------------//


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,

    // Aditional imports:
    HttpClientModule,

    // Shared Module:
    SharedModule,

    // Auth:
    AuthModule,

    // Modules:
    ModalitiesModule,
    OrganizationsModule,
    BranchesModule,
    ServicesModule,
    EquipmentsModule,
    UsersModule,
    SlotsModule,
    ProceduresModule,
    ProcedureCategoriesModule,
    FilesModule,
    LogsModule,
    AppointmentsModule,
    CheckInModule,
    CalendarModule,
    PathologiesModule,
    PerformingModule,
    ReportsModule,
    AdvancedSearchModule,
    StatsModule
  ],
  providers: [
    AppInitializer,
    { provide: APP_INITIALIZER, useFactory: (appInitializer: AppInitializer) => appInitializer.initializeApp(), multi: true, deps: [AppInitializer] },
    { provide: HTTP_INTERCEPTORS, useClass: HttpInterceptorService, multi: true },
    { provide: LOCALE_ID, useValue: 'es-AR' },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }