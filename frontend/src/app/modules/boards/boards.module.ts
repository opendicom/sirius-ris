import { NgModule, APP_INITIALIZER } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppInitializer } from '@app/app-initializer';
import { BoardsRoutingModule } from '@modules/boards/boards-routing.module';
import { SharedModule } from '@shared/shared.module';
import { SharedMaterialModule } from '@shared/shared-material.module';
import { ListComponent } from '@modules/boards/components/list/list.component';
import { FormComponent } from '@modules/boards/components/form/form.component';

@NgModule({
  declarations: [ListComponent, FormComponent],
  imports: [
    CommonModule,
    BoardsRoutingModule,
    SharedModule,
    SharedMaterialModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [
    AppInitializer,
    { provide: APP_INITIALIZER, useFactory: (appInitializer: AppInitializer) => appInitializer.initializeApp(), multi: true, deps: [AppInitializer] },
  ]
})
export class BoardsModule { }