import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from '@app/app-routing.module';
import { AppComponent } from '@app/app.component';

//---------------------------------------------------------------------------------------------------------------------------//
// Import MAT_DATE_LOCALE to set locale code:
//---------------------------------------------------------------------------------------------------------------------------//
import { MAT_DATE_LOCALE } from '@angular/material/core';
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
    UsersModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: HttpInterceptorService, multi: true },
    { provide: MAT_DATE_LOCALE, useValue: 'es-AR' },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
