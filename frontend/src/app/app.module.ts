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
    ModalitiesModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: HttpInterceptorService, multi: true },
    { provide: MAT_DATE_LOCALE, useValue: 'es-AR' },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
