import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from '@app/app-routing.module';
import { AppComponent } from '@app/app.component';

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
    CheckInModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: HttpInterceptorService, multi: true },
    { provide: LOCALE_ID, useValue: 'es-AR' },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
