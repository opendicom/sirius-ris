import { NgModule, APP_INITIALIZER } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LogsRoutingModule } from '@modules/logs/logs-routing.module';

import { AppInitializer } from '@app/app-initializer';
import { SharedModule } from '@shared/shared.module';
import { SharedMaterialModule } from '@shared/shared-material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ListByUserComponent } from '@modules/logs/components/list-by-user/list-by-user.component';
import { ListByElementComponent } from '@modules/logs/components/list-by-element/list-by-element.component';


@NgModule({
  declarations: [
    ListByUserComponent,
    ListByElementComponent
  ],
  imports: [
    CommonModule,
    LogsRoutingModule,
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
export class LogsModule { }
