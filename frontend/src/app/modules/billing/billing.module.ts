import { NgModule, APP_INITIALIZER } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BillingRoutingModule } from '@modules/billing/billing-routing.module';

import { AppInitializer } from '@app/app-initializer';
import { SharedModule } from '@shared/shared.module';
import { SharedMaterialModule } from '@shared/shared-material.module';

import { ListComponent } from '@modules/billing/components/list/list.component';


@NgModule({
  declarations: [
    ListComponent
  ],
  imports: [
    CommonModule,
    BillingRoutingModule,
    SharedModule,
    SharedMaterialModule
  ],
  providers: [
    // If you enter this module directly having an authentication file in the browser, it is necessary to 
    // initialize the app from the module (For example: entry from a marker of a specific component):
    AppInitializer,
    { provide: APP_INITIALIZER, useFactory: (appInitializer: AppInitializer) => appInitializer.initializeApp(), multi: true, deps: [AppInitializer] },
  ]
})
export class BillingModule { }
