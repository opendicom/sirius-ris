import { NgModule, APP_INITIALIZER } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CheckInBoardsRoutingModule } from '@modules/check-in-boards/check-in-boards-routing.module';

import { AppInitializer } from '@app/app-initializer';
import { SharedModule } from '@shared/shared.module';
import { SharedMaterialModule } from '@shared/shared-material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ListComponent } from '@modules/check-in-boards/components/list/list.component';
import { DetailsComponent } from '@modules/check-in-boards/components/details/details.component';

@NgModule({
  declarations: [
    ListComponent,
    DetailsComponent
  ],
  imports: [
    CommonModule,
    CheckInBoardsRoutingModule,
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
export class CheckInBoardsModule { }
