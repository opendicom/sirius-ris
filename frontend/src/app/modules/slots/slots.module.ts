import { NgModule, APP_INITIALIZER } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SlotsRoutingModule } from './slots-routing.module';

import { AppInitializer } from '@app/app-initializer';
import { SharedModule } from '@shared/shared.module';
import { SharedMaterialModule } from '@shared/shared-material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ListComponent } from '@modules/slots/components/list/list.component';
import { FormComponent } from '@modules/slots/components/form/form.component';
import { BatchComponent } from '@modules/slots/components/batch/batch.component';

@NgModule({
  declarations: [
    ListComponent,
    FormComponent,
    BatchComponent
  ],
  imports: [
    CommonModule,
    SlotsRoutingModule,
    SharedModule,
    SharedMaterialModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [
    // If you enter this module directly having an authentication file in the browser, it is necessary to 
    // initialize the app from the module (For example: entry from a marker of a specific component):
    AppInitializer,
    { provide: APP_INITIALIZER, useFactory: (appInitializer: AppInitializer) => appInitializer.initializeApp(), multi: true, deps: [AppInitializer] },
  ]
})
export class SlotsModule { }
